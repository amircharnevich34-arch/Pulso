-- Reference data: meal slots, food categories, food bank.
-- Safe to re-run (idempotent via ON CONFLICT).

insert into public.meal_slots (key, label, sort_order) values
  ('desayuno', 'Desayuno', 1),
  ('colacion1', 'Colación (media mañana)', 2),
  ('comida', 'Comida', 3),
  ('colacion2', 'Colación (media tarde)', 4),
  ('cena', 'Cena', 5)
on conflict (key) do nothing;

insert into public.food_categories (key, label, sort_order) values
  ('cereal', 'Cereal', 1),
  ('proteina', 'Producto animal', 2),
  ('leche', 'Leche', 3),
  ('fruta', 'Fruta', 4),
  ('verdura', 'Verdura', 5),
  ('grasa', 'Grasa', 6),
  ('azucar', 'Azúcar', 7)
on conflict (key) do nothing;

insert into public.food_bank_items (food_category_id, name, portion_description)
select id, item.name, item.portion from public.food_categories, (values
  ('cereal', 'Tortilla de maíz', '1 pieza'),
  ('cereal', 'Arroz cocido', '1/2 taza'),
  ('cereal', 'Pan integral', '1 rebanada'),
  ('cereal', 'Avena cocida', '1/2 taza'),
  ('cereal', 'Papa cocida', '1/2 pieza'),
  ('proteina', 'Pechuga de pollo', '30 g'),
  ('proteina', 'Huevo', '1 pieza'),
  ('proteina', 'Atún en agua', '1/4 taza'),
  ('proteina', 'Frijoles cocidos', '1/2 taza'),
  ('proteina', 'Queso panela', '30 g'),
  ('proteina', 'Claras de huevo', '3 piezas'),
  ('leche', 'Leche descremada', '1 taza'),
  ('leche', 'Yogur natural', '1 taza'),
  ('leche', 'Leche de almendra sin azúcar', '1 taza'),
  ('fruta', 'Manzana', '1 pieza'),
  ('fruta', 'Plátano', '1 pieza'),
  ('fruta', 'Papaya', '1 taza'),
  ('fruta', 'Fresas', '1 taza'),
  ('verdura', 'Ensalada verde', '1 taza'),
  ('verdura', 'Brócoli cocido', '1/2 taza'),
  ('verdura', 'Zanahoria cruda', '1/2 taza'),
  ('verdura', 'Espinaca', '1 taza'),
  ('grasa', 'Aguacate', '1/3 pieza'),
  ('grasa', 'Almendras', '10 piezas'),
  ('grasa', 'Aceite de oliva', '1 cdta'),
  ('azucar', 'Miel', '1 cdta'),
  ('azucar', 'Mermelada', '1 cdta'),
  ('azucar', 'Chocolate oscuro', '1 cuadro')
) as item(category_key, name, portion)
where public.food_categories.key = item.category_key
on conflict do nothing;
