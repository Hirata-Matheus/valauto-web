-- ValAuto — dados iniciais (tipos, categorias, montadoras e catalogo de carros).
-- Idempotente: pode rodar de novo sem duplicar.

insert into public.vehicle_types (slug, label, position) values
  ('carro', 'Carro', 1),
  ('moto', 'Moto', 2),
  ('caminhao', 'Caminhão', 3)
on conflict (slug) do update set label = excluded.label, position = excluded.position;

insert into public.rating_categories (slug, name, description, applies_to, position) values
  ('desempenho', 'Desempenho', 'Potência, retomada e comportamento dinâmico.', '{}', 1),
  ('conforto', 'Conforto', 'Acabamento, espaço interno, ruído e suspensão.', '{}', 2),
  ('seguranca', 'Segurança', 'Itens de série, estabilidade e resultados de crash test.', '{}', 3),
  ('economia', 'Economia', 'Consumo, manutenção e custo de uso no dia a dia.', '{}', 4),
  ('tecnologia', 'Tecnologia', 'Multimídia, conectividade e assistentes de condução.', '{}', 5)
on conflict (slug) do update
  set name = excluded.name,
      description = excluded.description,
      applies_to = excluded.applies_to,
      position = excluded.position;

insert into public.brands (name, slug, country) values
  ('Toyota', 'toyota', 'Japão'),
  ('Honda', 'honda', 'Japão'),
  ('Volkswagen', 'volkswagen', 'Alemanha'),
  ('Chevrolet', 'chevrolet', 'Estados Unidos'),
  ('Hyundai', 'hyundai', 'Coreia do Sul'),
  ('Fiat', 'fiat', 'Itália'),
  ('Jeep', 'jeep', 'Estados Unidos'),
  ('BYD', 'byd', 'China')
on conflict (slug) do update set name = excluded.name, country = excluded.country;

insert into public.vehicles (slug, brand_id, type, model, year, price, short_description, specs)
select v.slug, b.id, 'carro', v.model, v.year, v.price, v.short_description, v.specs
from (values
  ('toyota-corolla-2024', 'toyota', 'Corolla', 2024, 164990,
   'Sedã médio com foco em confiabilidade e consumo equilibrado.',
   '{"powerHp":177,"fuelConsumptionKmL":13.8,"acceleration0to100s":9.2,"seats":5,"trunkLiters":470}'::jsonb),
  ('toyota-corolla-cross-2024', 'toyota', 'Corolla Cross', 2024, 199990,
   'SUV híbrido derivado do Corolla, com boa altura livre do solo.',
   '{"powerHp":122,"fuelConsumptionKmL":16.2,"acceleration0to100s":10.7,"seats":5,"trunkLiters":440}'::jsonb),
  ('honda-civic-2024', 'honda', 'Civic', 2024, 249900,
   'Sedã esportivo com trem de força híbrido e acabamento refinado.',
   '{"powerHp":200,"fuelConsumptionKmL":17.0,"acceleration0to100s":7.9,"seats":5,"trunkLiters":409}'::jsonb),
  ('honda-hr-v-2023', 'honda', 'HR-V', 2023, 159900,
   'SUV compacto com espaço interno acima da média da categoria.',
   '{"powerHp":126,"fuelConsumptionKmL":12.9,"acceleration0to100s":11.4,"seats":5,"trunkLiters":354}'::jsonb),
  ('volkswagen-t-cross-2024', 'volkswagen', 'T-Cross', 2024, 154990,
   'SUV urbano com motor turbo e pacote de assistentes de condução.',
   '{"powerHp":128,"fuelConsumptionKmL":12.4,"acceleration0to100s":10.4,"seats":5,"trunkLiters":373}'::jsonb),
  ('volkswagen-polo-2023', 'volkswagen', 'Polo', 2023, 98990,
   'Hatch compacto com boa estrutura e opções turbo.',
   '{"powerHp":116,"fuelConsumptionKmL":13.1,"acceleration0to100s":10.0,"seats":5,"trunkLiters":300}'::jsonb),
  ('chevrolet-onix-2024', 'chevrolet', 'Onix', 2024, 94990,
   'Hatch de entrada com motor 1.0 turbo e central multimídia completa.',
   '{"powerHp":116,"fuelConsumptionKmL":13.9,"acceleration0to100s":10.3,"seats":5,"trunkLiters":275}'::jsonb),
  ('chevrolet-tracker-2024', 'chevrolet', 'Tracker', 2024, 139990,
   'SUV compacto com pacote de segurança robusto de série.',
   '{"powerHp":133,"fuelConsumptionKmL":12.2,"acceleration0to100s":10.6,"seats":5,"trunkLiters":393}'::jsonb),
  ('hyundai-hb20-2024', 'hyundai', 'HB20', 2024, 89990,
   'Hatch econômico com boa relação custo-benefício.',
   '{"powerHp":120,"fuelConsumptionKmL":13.5,"acceleration0to100s":10.8,"seats":5,"trunkLiters":300}'::jsonb),
  ('hyundai-creta-2024', 'hyundai', 'Creta', 2024, 169990,
   'SUV médio com interior espaçoso e bom isolamento acústico.',
   '{"powerHp":130,"fuelConsumptionKmL":11.8,"acceleration0to100s":10.1,"seats":5,"trunkLiters":422}'::jsonb),
  ('fiat-pulse-2024', 'fiat', 'Pulse', 2024, 119990,
   'SUV compacto nacional com motor turbo de três cilindros.',
   '{"powerHp":130,"fuelConsumptionKmL":12.0,"acceleration0to100s":9.8,"seats":5,"trunkLiters":370}'::jsonb),
  ('fiat-argo-2023', 'fiat', 'Argo', 2023, 84990,
   'Hatch de entrada com custo de manutenção baixo.',
   '{"powerHp":77,"fuelConsumptionKmL":13.2,"acceleration0to100s":13.0,"seats":5,"trunkLiters":300}'::jsonb),
  ('jeep-compass-2024', 'jeep', 'Compass', 2024, 209990,
   'SUV médio com tração 4x4 disponível e forte apelo off-road.',
   '{"powerHp":185,"fuelConsumptionKmL":10.6,"acceleration0to100s":8.9,"seats":5,"trunkLiters":467}'::jsonb),
  ('jeep-renegade-2023', 'jeep', 'Renegade', 2023, 149990,
   'SUV compacto com postura robusta e boa dirigibilidade urbana.',
   '{"powerHp":185,"fuelConsumptionKmL":10.9,"acceleration0to100s":9.4,"seats":5,"trunkLiters":320}'::jsonb),
  ('byd-dolphin-2024', 'byd', 'Dolphin', 2024, 149800,
   'Hatch 100% elétrico com carregamento rápido e boa autonomia urbana.',
   '{"powerHp":95,"fuelConsumptionKmL":0,"acceleration0to100s":12.3,"seats":5,"trunkLiters":345}'::jsonb),
  ('byd-song-plus-2024', 'byd', 'Song Plus', 2024, 239800,
   'SUV híbrido plug-in com autonomia elétrica para o uso diário.',
   '{"powerHp":235,"fuelConsumptionKmL":18.5,"acceleration0to100s":8.5,"seats":5,"trunkLiters":574}'::jsonb)
) as v (slug, brand_slug, model, year, price, short_description, specs)
join public.brands b on b.slug = v.brand_slug
on conflict (slug) do nothing;
