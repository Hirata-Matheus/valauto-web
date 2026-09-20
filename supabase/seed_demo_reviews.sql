-- ============================================================================
-- ValAuto — avaliações de DEMONSTRAÇÃO
--
-- Cria 30 usuários fictícios e 75 avaliações para os 16 veículos do seed,
-- para o catálogo, as médias e a ordenação por nota terem o que mostrar.
--
-- >>> São dados FICTÍCIOS. Não os deixe num site público apresentados como
-- >>> opiniões de clientes reais. Para remover tudo de uma vez:
-- >>>   supabase/cleanup_demo_reviews.sql
--
-- Como os dados de demonstração são identificados:
--   * e-mail terminando em @demo.valauto.invalid (o TLD ".invalid" nunca resolve);
--   * os usuários não têm senha, então ninguém consegue fazer login com eles.
--
-- Pré-requisitos: 0001_init.sql e seed.sql já executados.
-- Idempotente: pode rodar de novo sem duplicar (usa ON CONFLICT DO NOTHING).
--
-- A carga inteira roda dentro de UM bloco DO: o SQL Editor do Supabase pode
-- executar cada comando numa sessão diferente, e uma tabela temporária criada
-- num comando não existiria no seguinte. Um bloco só é atômico e não depende disso.
-- ============================================================================

do $$
begin

-- 1) Usuários fictícios. O trigger on_auth_user_created cria o profile de cada
--    um já com email_verified_at preenchido.
insert into auth.users (
  id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  u.id::uuid, 'authenticated', 'authenticated', u.email, now() - interval '240 days',
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', u.name, 'demo', true),
  now() - interval '240 days', now() - interval '240 days', '', '', '', ''
from (values
  ('d0000000-0000-4000-8000-000000000001', 'marcelo.tavares@demo.valauto.invalid', 'Marcelo Tavares'),
  ('d0000000-0000-4000-8000-000000000002', 'juliana.pires@demo.valauto.invalid', 'Juliana Pires'),
  ('d0000000-0000-4000-8000-000000000003', 'rafael.monteiro@demo.valauto.invalid', 'Rafael Monteiro'),
  ('d0000000-0000-4000-8000-000000000004', 'camila.barbosa@demo.valauto.invalid', 'Camila Barbosa'),
  ('d0000000-0000-4000-8000-000000000005', 'thiago.nascimento@demo.valauto.invalid', 'Thiago Nascimento'),
  ('d0000000-0000-4000-8000-000000000006', 'patricia.gomes@demo.valauto.invalid', 'Patrícia Gomes'),
  ('d0000000-0000-4000-8000-000000000007', 'eduardo.castro@demo.valauto.invalid', 'Eduardo Castro'),
  ('d0000000-0000-4000-8000-000000000008', 'fernanda.lopes@demo.valauto.invalid', 'Fernanda Lopes'),
  ('d0000000-0000-4000-8000-000000000009', 'rodrigo.azevedo@demo.valauto.invalid', 'Rodrigo Azevedo'),
  ('d0000000-0000-4000-8000-000000000010', 'larissa.freitas@demo.valauto.invalid', 'Larissa Freitas'),
  ('d0000000-0000-4000-8000-000000000011', 'gustavo.batista@demo.valauto.invalid', 'Gustavo Batista'),
  ('d0000000-0000-4000-8000-000000000012', 'beatriz.moura@demo.valauto.invalid', 'Beatriz Moura'),
  ('d0000000-0000-4000-8000-000000000013', 'andre.cardoso@demo.valauto.invalid', 'André Cardoso'),
  ('d0000000-0000-4000-8000-000000000014', 'vanessa.teixeira@demo.valauto.invalid', 'Vanessa Teixeira'),
  ('d0000000-0000-4000-8000-000000000015', 'leandro.siqueira@demo.valauto.invalid', 'Leandro Siqueira'),
  ('d0000000-0000-4000-8000-000000000016', 'aline.cavalcanti@demo.valauto.invalid', 'Aline Cavalcanti'),
  ('d0000000-0000-4000-8000-000000000017', 'bruno.rezende@demo.valauto.invalid', 'Bruno Rezende'),
  ('d0000000-0000-4000-8000-000000000018', 'tatiane.ramos@demo.valauto.invalid', 'Tatiane Ramos'),
  ('d0000000-0000-4000-8000-000000000019', 'felipe.andrade@demo.valauto.invalid', 'Felipe Andrade'),
  ('d0000000-0000-4000-8000-000000000020', 'renata.duarte@demo.valauto.invalid', 'Renata Duarte'),
  ('d0000000-0000-4000-8000-000000000021', 'vinicius.correia@demo.valauto.invalid', 'Vinícius Correia'),
  ('d0000000-0000-4000-8000-000000000022', 'michele.farias@demo.valauto.invalid', 'Michele Farias'),
  ('d0000000-0000-4000-8000-000000000023', 'douglas.pacheco@demo.valauto.invalid', 'Douglas Pacheco'),
  ('d0000000-0000-4000-8000-000000000024', 'cristiane.bastos@demo.valauto.invalid', 'Cristiane Bastos'),
  ('d0000000-0000-4000-8000-000000000025', 'henrique.vieira@demo.valauto.invalid', 'Henrique Vieira'),
  ('d0000000-0000-4000-8000-000000000026', 'priscila.nunes@demo.valauto.invalid', 'Priscila Nunes'),
  ('d0000000-0000-4000-8000-000000000027', 'alexandre.melo@demo.valauto.invalid', 'Alexandre Melo'),
  ('d0000000-0000-4000-8000-000000000028', 'daniela.xavier@demo.valauto.invalid', 'Daniela Xavier'),
  ('d0000000-0000-4000-8000-000000000029', 'sergio.machado@demo.valauto.invalid', 'Sérgio Machado'),
  ('d0000000-0000-4000-8000-000000000030', 'luciana.peixoto@demo.valauto.invalid', 'Luciana Peixoto')
) as u (id, email, name)
on conflict (id) do nothing;

-- 2) Dados das avaliações. Notas: desempenho, conforto, segurança, economia,
--    tecnologia (null = o usuário não avaliou aquela categoria).
drop table if exists _demo_reviews;
create temp table _demo_reviews (
  vehicle_slug text, user_id uuid, days_ago integer,
  desempenho numeric, conforto numeric, seguranca numeric, economia numeric, tecnologia numeric,
  comment text
);

insert into _demo_reviews values
  ('toyota-corolla-2024', 'd0000000-0000-4000-8000-000000000001', 12, 4, 4.5, 4.5, 4.5, 4, 'Sétimo mês com o carro e zero problema. Roda bem na estrada e na cidade faço uns 12 km/l. Só achei a central multimídia meio lenta para responder.'),
  ('toyota-corolla-2024', 'd0000000-0000-4000-8000-000000000002', 38, 4, 4.5, 5, 4, 4, 'Troquei um sedã mais antigo por ele e a diferença de silêncio interno é grande. Bancos ótimos para viagem longa.'),
  ('toyota-corolla-2024', 'd0000000-0000-4000-8000-000000000003', 71, 3.5, 4.5, 4.5, 5, 3.5, 'Ótimo para quem roda muito. Não é esportivo, mas ultrapassa com segurança. A revisão na concessionária é cara, porém espaçada.'),
  ('toyota-corolla-2024', 'd0000000-0000-4000-8000-000000000004', 104, 4, 4, 4.5, 4.5, 4, null),
  ('toyota-corolla-2024', 'd0000000-0000-4000-8000-000000000005', 160, 4.5, 5, 5, 4.5, 4.5, 'Uso no trabalho todo dia, uns 80 km por dia. Nunca me deixou na mão. Recomendo.'),
  ('toyota-corolla-cross-2024', 'd0000000-0000-4000-8000-000000000006', 9, 3.5, 4.5, 4.5, 5, 4, 'O híbrido faz diferença no trânsito: na cidade passo dos 16 km/l fácil. A retomada é suave, mas não espere emoção.'),
  ('toyota-corolla-cross-2024', 'd0000000-0000-4000-8000-000000000007', 45, 3, 4.5, 4.5, 5, 3.5, 'Consumo impressionante para um SUV. Achei o desempenho só razoável com quatro pessoas e mala no carro.'),
  ('toyota-corolla-cross-2024', 'd0000000-0000-4000-8000-000000000008', 88, 4, 4.5, 5, 4.5, 4.5, 'Muito bem acabado e silencioso. Os assistentes de faixa funcionam bem sem ficar irritando.'),
  ('toyota-corolla-cross-2024', 'd0000000-0000-4000-8000-000000000009', 130, 3.5, 4, 4.5, 5, 4, null),
  ('toyota-corolla-cross-2024', 'd0000000-0000-4000-8000-000000000010', 175, 3.5, 5, 4.5, 4.5, 3.5, 'Espaço traseiro bom para minhas duas filhas com cadeirinha. O porta-malas poderia ser um pouco maior.'),
  ('honda-civic-2024', 'd0000000-0000-4000-8000-000000000011', 7, 5, 4.5, 4.5, 4.5, 5, 'Dirigir o Civic híbrido é bem prazeroso: resposta imediata e ótima estabilidade em curva. A tela é rápida e a conexão com o celular funciona sem drama.'),
  ('honda-civic-2024', 'd0000000-0000-4000-8000-000000000012', 29, 5, 4.5, 4.5, 4.5, 4.5, 'Vim de um Golf e não senti falta de nada. Preço alto, mas entrega o que promete.'),
  ('honda-civic-2024', 'd0000000-0000-4000-8000-000000000013', 62, 4.5, 4, 5, 4.5, 4.5, 'O banco traseiro poderia ter um pouco mais de espaço para as pernas. Fora isso, perfeito.'),
  ('honda-civic-2024', 'd0000000-0000-4000-8000-000000000014', 97, 5, 5, 4.5, 4, 4.5, null),
  ('honda-civic-2024', 'd0000000-0000-4000-8000-000000000015', 140, 4.5, 4.5, 4.5, 5, 4, 'Faço Rio–São Paulo com frequência e o consumo na estrada surpreende para um carro com esse desempenho.'),
  ('honda-hr-v-2023', 'd0000000-0000-4000-8000-000000000016', 15, 3.5, 4.5, 4, 4, 3.5, 'Espaço interno realmente acima da média. Meu ponto fraco é o motor: em subida com o carro cheio ele pede para reduzir a marcha.'),
  ('honda-hr-v-2023', 'd0000000-0000-4000-8000-000000000017', 52, 3, 4.5, 4, 4, 3, 'Carro confortável e fácil de dirigir na cidade. A multimídia parece de uma geração atrás.'),
  ('honda-hr-v-2023', 'd0000000-0000-4000-8000-000000000018', 110, 3.5, 4.5, 4, 4, 4, null),
  ('honda-hr-v-2023', 'd0000000-0000-4000-8000-000000000019', 190, 4, 4.5, 4.5, 4, 3.5, 'Levo a família toda nos fins de semana e ninguém reclama. Os bancos versáteis ajudam muito.'),
  ('volkswagen-t-cross-2024', 'd0000000-0000-4000-8000-000000000020', 5, 4, 4, 4.5, 3.5, 4.5, 'Motor turbo responde bem e o painel digital é bonito. O consumo na cidade não é dos melhores, umas 10 km/l.'),
  ('volkswagen-t-cross-2024', 'd0000000-0000-4000-8000-000000000021', 33, 4, 4, 5, 3.5, 4.5, 'Os assistentes de condução me deram segurança em viagem. Na minha versão, o controle de cruzeiro adaptativo é ótimo no trânsito da rodovia.'),
  ('volkswagen-t-cross-2024', 'd0000000-0000-4000-8000-000000000022', 68, 4, 3.5, 4.5, 3.5, 4.5, 'Suspensão firme, o que é bom em curva mas cansa em rua ruim.'),
  ('volkswagen-t-cross-2024', 'd0000000-0000-4000-8000-000000000023', 121, 4.5, 4, 4.5, 3, 4, null),
  ('volkswagen-t-cross-2024', 'd0000000-0000-4000-8000-000000000024', 180, 4, 4.5, 4.5, 4, 4.5, 'Acabamento acima do que eu esperava nessa faixa de preço.'),
  ('volkswagen-polo-2023', 'd0000000-0000-4000-8000-000000000025', 20, 4, 3.5, 4.5, 4, 3.5, 'Carro sólido, dá para sentir na porta e na estrada. O espaço atrás é justo para adultos.'),
  ('volkswagen-polo-2023', 'd0000000-0000-4000-8000-000000000026', 58, 4, 3.5, 4.5, 4, 3, 'A versão turbo anda bem. O sistema multimídia da minha versão é básico, mas cumpre.'),
  ('volkswagen-polo-2023', 'd0000000-0000-4000-8000-000000000027', 115, 3.5, 3.5, 4.5, 4, 3.5, null),
  ('volkswagen-polo-2023', 'd0000000-0000-4000-8000-000000000028', 200, 4, 3.5, 5, 4.5, 3.5, 'Estou muito satisfeito. Custo de manutenção baixo até agora e estabilidade excelente.'),
  ('chevrolet-onix-2024', 'd0000000-0000-4000-8000-000000000029', 3, 3.5, 3.5, 4, 4.5, 4, 'Para o preço, é difícil achar algo melhor. Central multimídia completa e conecta rápido no celular.'),
  ('chevrolet-onix-2024', 'd0000000-0000-4000-8000-000000000030', 26, 3.5, 3, 4, 4.5, 4, 'Uso como carro de aplicativo, faço uns 13 km/l na cidade. Cansa um pouco depois de muitas horas, o banco poderia ser melhor.'),
  ('chevrolet-onix-2024', 'd0000000-0000-4000-8000-000000000001', 49, 3.5, 3.5, 4, 5, 4.5, null),
  ('chevrolet-onix-2024', 'd0000000-0000-4000-8000-000000000002', 83, 3, 3.5, 3.5, 4.5, 3.5, 'O motor 1.0 turbo é bom, mas em estrada carregado sente falta de fôlego. O ruído interno também aparece acima de 100 km/h.'),
  ('chevrolet-onix-2024', 'd0000000-0000-4000-8000-000000000003', 126, 4, 3.5, 4, 4.5, 4, 'Primeiro zero km da vida e estou adorando. Econômico e sem frescura.'),
  ('chevrolet-onix-2024', 'd0000000-0000-4000-8000-000000000004', 170, 3.5, 3.5, 4.5, 4.5, 4, 'A segurança de série melhorou muito. Bom para quem quer algo prático.'),
  ('chevrolet-tracker-2024', 'd0000000-0000-4000-8000-000000000005', 11, 4, 4, 4.5, 3.5, 4, 'O pacote de segurança de série completo foi o que pesou na compra. Dirigibilidade boa para o tamanho.'),
  ('chevrolet-tracker-2024', 'd0000000-0000-4000-8000-000000000006', 40, 4, 4, 5, 3.5, 4, 'Gosto da posição de dirigir mais alta. O consumo real fica em torno de 11 km/l misto.'),
  ('chevrolet-tracker-2024', 'd0000000-0000-4000-8000-000000000007', 79, 4, 4.5, 4.5, 3.5, 3.5, null),
  ('chevrolet-tracker-2024', 'd0000000-0000-4000-8000-000000000008', 135, 4.5, 4, 4.5, 3.5, 4.5, 'O motor turbo entrega bem. A tela é grande e o sistema é intuitivo.'),
  ('chevrolet-tracker-2024', 'd0000000-0000-4000-8000-000000000009', 185, 3.5, 4, 4, 3, 4, 'Bom carro, mas o consumo na cidade me decepcionou um pouco.'),
  ('hyundai-hb20-2024', 'd0000000-0000-4000-8000-000000000010', 6, 3.5, 3.5, 4, 4.5, 3.5, 'Excelente custo-benefício. Dirigi vários hatches antes de escolher e o HB20 foi o mais equilibrado.'),
  ('hyundai-hb20-2024', 'd0000000-0000-4000-8000-000000000011', 31, 3.5, 3.5, 4, 4.5, 3.5, null),
  ('hyundai-hb20-2024', 'd0000000-0000-4000-8000-000000000012', 64, 3, 3, 3.5, 4.5, 3, 'O motor aspirado fica devendo em ultrapassagem. Para cidade resolve bem.'),
  ('hyundai-hb20-2024', 'd0000000-0000-4000-8000-000000000013', 117, 3.5, 3.5, 4, 4.5, 4, 'A garantia longa deu tranquilidade. Uso todo dia no trabalho e o consumo é ótimo.'),
  ('hyundai-hb20-2024', 'd0000000-0000-4000-8000-000000000014', 165, 4, 3.5, 4, 4.5, 3.5, 'Câmbio automático suave, sem trancos no trânsito.'),
  ('hyundai-creta-2024', 'd0000000-0000-4000-8000-000000000015', 14, 4, 4.5, 4, 3.5, 4.5, 'Interior espaçoso e silencioso. O ar-condicionado gela rápido, coisa importante aqui no calor.'),
  ('hyundai-creta-2024', 'd0000000-0000-4000-8000-000000000016', 42, 4, 4.5, 4, 3.5, 4.5, 'Painel digital e conectividade muito bons. Consumo mediano, uns 10,5 km/l misto.'),
  ('hyundai-creta-2024', 'd0000000-0000-4000-8000-000000000017', 77, 3.5, 4.5, 4, 3.5, 4, null),
  ('hyundai-creta-2024', 'd0000000-0000-4000-8000-000000000018', 123, 4, 4, 4.5, 3.5, 4.5, 'Bem completo na versão que comprei. Bancos de couro confortáveis.'),
  ('hyundai-creta-2024', 'd0000000-0000-4000-8000-000000000019', 178, 4, 4.5, 4, 3, 4, 'Ótimo para viagem, mas gasta um pouco mais que os concorrentes.'),
  ('fiat-pulse-2024', 'd0000000-0000-4000-8000-000000000020', 8, 4, 3.5, 4, 3.5, 4, 'Visual bonito e motor turbo bem disposto. A multimídia é rápida.'),
  ('fiat-pulse-2024', 'd0000000-0000-4000-8000-000000000021', 36, 4, 3.5, 4, 3.5, 4.5, 'Comprei pela conectividade e pelo preço. Não me arrependi.'),
  ('fiat-pulse-2024', 'd0000000-0000-4000-8000-000000000022', 74, 4, 3.5, 3.5, 3.5, 4, null),
  ('fiat-pulse-2024', 'd0000000-0000-4000-8000-000000000023', 128, 3.5, 3, 4, 3.5, 4, 'O banco traseiro poderia ser mais confortável em viagem longa.'),
  ('fiat-pulse-2024', 'd0000000-0000-4000-8000-000000000024', 172, 4.5, 4, 4, 3.5, 4, 'Muito bom de dirigir na cidade e na estrada. Retomadas rápidas.'),
  ('fiat-argo-2023', 'd0000000-0000-4000-8000-000000000025', 18, 2.5, 3, 3.5, 4.5, 3, 'Carro simples e honesto. O motor 1.0 não empolga, mas o consumo é ótimo e a manutenção é barata.'),
  ('fiat-argo-2023', 'd0000000-0000-4000-8000-000000000026', 55, 2.5, 3, 3.5, 4.5, 3, 'Para uso urbano atende bem. Em estrada com o ar ligado precisa de paciência.'),
  ('fiat-argo-2023', 'd0000000-0000-4000-8000-000000000027', 112, 3, 3, 3.5, 5, 3, null),
  ('fiat-argo-2023', 'd0000000-0000-4000-8000-000000000028', 195, 2.5, 3.5, 3.5, 4.5, 3.5, 'Comprei para minha esposa ir ao trabalho. Fácil de estacionar e nunca deu problema.'),
  ('jeep-compass-2024', 'd0000000-0000-4000-8000-000000000029', 10, 4.5, 4.5, 4.5, 3, 4.5, 'Carro robusto e confortável na estrada. O consumo é o ponto fraco, faço uns 9 km/l na cidade.'),
  ('jeep-compass-2024', 'd0000000-0000-4000-8000-000000000030', 37, 4.5, 4.5, 4.5, 3, 4.5, 'A versão com tração 4x4 me deu confiança numa viagem de serra com chuva.'),
  ('jeep-compass-2024', 'd0000000-0000-4000-8000-000000000001', 82, 4.5, 4.5, 5, 2.5, 4, null),
  ('jeep-compass-2024', 'd0000000-0000-4000-8000-000000000002', 131, 4, 4.5, 4.5, 3, 4.5, 'Acabamento ótimo e central multimídia rápida.'),
  ('jeep-compass-2024', 'd0000000-0000-4000-8000-000000000003', 183, 5, 4.5, 4.5, 3, 4.5, 'Motor forte, ultrapassagens tranquilas. Vale se você aceita o consumo mais alto.'),
  ('jeep-renegade-2023', 'd0000000-0000-4000-8000-000000000004', 22, 4, 4, 4, 3, 4, 'Compacto e forte. Gosto da altura livre do solo para estrada de terra.'),
  ('jeep-renegade-2023', 'd0000000-0000-4000-8000-000000000005', 60, 4, 3.5, 4, 3, 4, 'O motor tem boa força, mas o consumo poderia ser melhor.'),
  ('jeep-renegade-2023', 'd0000000-0000-4000-8000-000000000006', 118, 4, 4, 4, 3, 4, null),
  ('jeep-renegade-2023', 'd0000000-0000-4000-8000-000000000007', 198, 4, 4, 4, 3, 3.5, 'Design diferente, chama atenção. A suspensão é um pouco firme demais na cidade.'),
  ('byd-dolphin-2024', 'd0000000-0000-4000-8000-000000000008', 4, 3.5, 4, 4, 5, 5, 'Estou impressionado com o custo por quilômetro. Recarrego em casa à noite e gasto uma fração do que gastava com gasolina.'),
  ('byd-dolphin-2024', 'd0000000-0000-4000-8000-000000000009', 28, 3.5, 4, 4, 5, 5, 'A tela giratória e o sistema de infoentretenimento são muito bons. A autonomia atende bem meu uso urbano.'),
  ('byd-dolphin-2024', 'd0000000-0000-4000-8000-000000000010', 66, 3.5, 4, 4, 5, 5, null),
  ('byd-dolphin-2024', 'd0000000-0000-4000-8000-000000000011', 119, 3, 4, 4, 4.5, 4.5, 'A falta de pontos de recarga rápida em alguns trechos ainda limita viagem longa.'),
  ('byd-dolphin-2024', 'd0000000-0000-4000-8000-000000000012', 163, 4, 4, 4.5, 5, 5, 'Silencioso e acelera bem no arranque. Ótimo para o dia a dia.'),
  ('byd-song-plus-2024', 'd0000000-0000-4000-8000-000000000013', 16, 4.5, 4.5, 4, 5, 5, 'Uso no modo elétrico na maior parte da semana e só abasteço para viajar. O porta-malas é enorme.'),
  ('byd-song-plus-2024', 'd0000000-0000-4000-8000-000000000014', 50, 4.5, 4.5, 4, 5, 5, null),
  ('byd-song-plus-2024', 'd0000000-0000-4000-8000-000000000015', 95, 4.5, 4.5, 4, 4.5, 5, 'Acabamento bom e muita tecnologia. Ainda me acostumando com o sistema de menus.');

-- 3) Avaliações (uma por usuário por veículo — a unique do schema garante).
insert into public.reviews (vehicle_id, user_id, comment, status, created_at, updated_at)
select v.id, d.user_id, d.comment, 'published',
       now() - make_interval(days => d.days_ago),
       now() - make_interval(days => d.days_ago)
from _demo_reviews d
join public.vehicles v on v.slug = d.vehicle_slug
on conflict (vehicle_id, user_id) do nothing;

-- 4) Notas por categoria. Os triggers recalculam o agregado a cada linha.
insert into public.review_ratings (review_id, category_id, score)
select r.id, c.id, x.score
from _demo_reviews d
join public.vehicles v on v.slug = d.vehicle_slug
join public.reviews r on r.vehicle_id = v.id and r.user_id = d.user_id
cross join lateral (values
  ('desempenho', d.desempenho), ('conforto', d.conforto), ('seguranca', d.seguranca),
  ('economia', d.economia), ('tecnologia', d.tecnologia)
) as x (slug, score)
join public.rating_categories c on c.slug = x.slug
where x.score is not null
on conflict (review_id, category_id) do nothing;

drop table if exists _demo_reviews;

-- 5) Garante o agregado consistente mesmo se algum trigger tiver sido pulado.
perform public.recompute_vehicle_summary(id) from public.vehicles;

end
$$;

-- 6) Conferência: médias por veículo, da melhor para a pior.
select
  b.name || ' ' || v.model as veiculo,
  s.review_count as avaliacoes,
  s.overall_average as nota_geral,
  s.category_averages as por_categoria
from public.vehicles v
join public.brands b on b.id = v.brand_id
join public.vehicle_rating_summaries s on s.vehicle_id = v.id
order by s.overall_average desc nulls last;
