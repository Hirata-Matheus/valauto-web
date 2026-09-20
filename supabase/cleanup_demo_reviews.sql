-- ============================================================================
-- ValAuto — remove as avaliações e usuários de DEMONSTRAÇÃO
--
-- Apaga os usuários com e-mail @demo.valauto.invalid. Por cascata somem também os
-- profiles, as avaliações e as notas deles; nenhum dado real é tocado.
-- Idempotente.
-- ============================================================================

delete from auth.users where email like '%@demo.valauto.invalid';

-- Recalcula o agregado de todos os veículos (volta a null onde não sobrou nota).
select public.recompute_vehicle_summary(id) from public.vehicles;

-- Conferência: deve retornar 0 em ambas as colunas.
select
  (select count(*) from auth.users where email like '%@demo.valauto.invalid') as usuarios_demo_restantes,
  (select count(*) from public.profiles p
     where not exists (select 1 from auth.users u where u.id = p.id)) as profiles_orfaos;
