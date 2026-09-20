-- ============================================================================
-- Smoke test: triggers de agregação de notas
--
-- Cole no SQL Editor do Supabase e execute. Nada fica gravado.
--
-- O script cria dois usuários e reviews de teste, confere a média por categoria
-- e a média geral a cada passo (inserir, EDITAR, denunciar, apagar) e termina
-- de propósito com uma EXCEÇÃO, que desfaz tudo. Portanto:
--
--   * "SMOKE TEST PASSED ..."  => tudo certo (o "erro" é só o rollback);
--   * qualquer outra mensagem   => falhou, e o texto diz em qual passo e por quê.
--
-- Cobre o caminho da EDIÇÃO de uma review (o app apaga as notas antigas e
-- insere as novas), que aciona o trigger de DELETE em review_ratings.
-- Não testa RLS (o papel do SQL Editor a ignora); isso é validado pela API.
-- ============================================================================

do $$
declare
  v_vehicle   uuid;
  c_desemp    uuid;
  c_conforto  uuid;
  c_economia  uuid;
  u_a         uuid := gen_random_uuid();
  u_b         uuid := gen_random_uuid();
  r_a         uuid;
  r_b         uuid;
  s           public.vehicle_rating_summaries%rowtype;
  report      text := '';

begin
  select id into v_vehicle from public.vehicles where slug = 'honda-civic-2024';
  select id into c_desemp   from public.rating_categories where slug = 'desempenho';
  select id into c_conforto from public.rating_categories where slug = 'conforto';
  select id into c_economia from public.rating_categories where slug = 'economia';

  if v_vehicle is null or c_desemp is null or c_conforto is null or c_economia is null then
    raise exception 'FALHOU no preparo: rode supabase/seed.sql antes (veículo ou categorias ausentes)';
  end if;

  -- Dois usuários com e-mail confirmado. O trigger on_auth_user_created cria os profiles.
  insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data, aud, role)
  values
    (u_a, 'smoke-a-' || u_a || '@example.invalid', now(), '{"name":"Smoke A"}', 'authenticated', 'authenticated'),
    (u_b, 'smoke-b-' || u_b || '@example.invalid', now(), '{"name":"Smoke B"}', 'authenticated', 'authenticated');

  if (select count(*) from public.profiles where id in (u_a, u_b) and email_verified_at is not null) <> 2 then
    raise exception 'FALHOU no passo 0: handle_new_user não criou os 2 profiles com email_verified_at preenchido';
  end if;
  report := report || E'\n  [0] profiles criados com e-mail verificado: ok';

  -- Passo 1: duas reviews publicadas.
  insert into public.reviews (vehicle_id, user_id, status) values (v_vehicle, u_a, 'published') returning id into r_a;
  insert into public.reviews (vehicle_id, user_id, status) values (v_vehicle, u_b, 'published') returning id into r_b;

  insert into public.review_ratings (review_id, category_id, score) values
    (r_a, c_desemp, 5), (r_a, c_conforto, 4),
    (r_b, c_desemp, 4), (r_b, c_economia, 2);

  select * into s from public.vehicle_rating_summaries where vehicle_id = v_vehicle;
  -- desempenho (5+4)/2=4.5 | conforto 4.0 | economia 2.0 | geral (4.5+4+2)/3=3.5 | 2 reviews
  if s.review_count <> 2
     or (s.category_averages ->> 'desempenho')::numeric <> 4.5
     or (s.category_averages ->> 'conforto')::numeric  <> 4.0
     or (s.category_averages ->> 'economia')::numeric  <> 2.0
     or s.overall_average <> 3.5 then
    raise exception 'FALHOU no passo 1 (inserir): esperado desempenho 4.5, conforto 4.0, economia 2.0, geral 3.5, 2 reviews; obtido % | % | %',
      s.category_averages, s.overall_average, s.review_count;
  end if;
  report := report || E'\n  [1] inserir: médias por categoria e geral corretas (geral = média das médias)';

  -- Passo 2: EDITAR a review A — apaga as notas e insere outras (dispara o trigger de DELETE).
  delete from public.review_ratings where review_id = r_a;
  insert into public.review_ratings (review_id, category_id, score) values (r_a, c_desemp, 3);

  select * into s from public.vehicle_rating_summaries where vehicle_id = v_vehicle;
  -- desempenho (3+4)/2=3.5 | conforto sumiu | economia 2.0 | geral (3.5+2)/2=2.75 | 2 reviews
  if s.review_count <> 2
     or (s.category_averages ->> 'desempenho')::numeric <> 3.5
     or (s.category_averages -> 'conforto') is not null
     or (s.category_averages ->> 'economia')::numeric <> 2.0
     or s.overall_average <> 2.75 then
    raise exception 'FALHOU no passo 2 (editar): esperado desempenho 3.5, sem conforto, economia 2.0, geral 2.75; obtido % | % | %',
      s.category_averages, s.overall_average, s.review_count;
  end if;
  report := report || E'\n  [2] editar (DELETE + INSERT em review_ratings): agregado recalculado, categoria removida some';

  -- Passo 3: review denunciada sai do agregado.
  update public.reviews set status = 'reported' where id = r_b;

  select * into s from public.vehicle_rating_summaries where vehicle_id = v_vehicle;
  -- só a A (desempenho 3): count 1 | desempenho 3.0 | geral 3.0
  if s.review_count <> 1
     or (s.category_averages ->> 'desempenho')::numeric <> 3.0
     or (s.category_averages -> 'economia') is not null
     or s.overall_average <> 3.0 then
    raise exception 'FALHOU no passo 3 (denunciar): esperado 1 review, desempenho 3.0, sem economia, geral 3.0; obtido % | % | %',
      s.category_averages, s.overall_average, s.review_count;
  end if;
  report := report || E'\n  [3] status "reported": review excluída do agregado';

  -- Passo 4: apagar a última review publicada volta ao estado "sem avaliação" (null, não zero).
  delete from public.reviews where id = r_a;

  select * into s from public.vehicle_rating_summaries where vehicle_id = v_vehicle;
  if s.review_count <> 0 or s.overall_average is not null or s.category_averages <> '{}'::jsonb then
    raise exception 'FALHOU no passo 4 (apagar): esperado 0 reviews, geral NULL, {}; obtido % | % | %',
      s.category_averages, s.overall_average, s.review_count;
  end if;
  report := report || E'\n  [4] apagar a última review: volta a null (sem avaliação), nunca zero';

  -- Passo 5: 1 review por usuário por veículo.
  begin
    insert into public.reviews (vehicle_id, user_id, status) values (v_vehicle, u_b, 'published');
    raise exception 'FALHOU no passo 5: permitiu 2ª review do mesmo usuário no mesmo veículo';
  exception when unique_violation then
    report := report || E'\n  [5] unique (vehicle_id, user_id): 2ª review do mesmo usuário barrada';
  end;

  -- Passo 6: nota fora da escala é recusada pelo banco.
  begin
    insert into public.review_ratings (review_id, category_id, score) values (r_b, c_conforto, 4.3);
    raise exception 'FALHOU no passo 6: aceitou nota 4.3 (fora do passo de 0,5)';
  exception when check_violation then
    report := report || E'\n  [6] check de escala: nota 4.3 recusada';
  end;

  -- Termina com exceção de propósito: desfaz TUDO acima.
  raise exception E'SMOKE TEST PASSED (o "erro" é só o rollback; nada foi gravado):%', report;
end
$$;
