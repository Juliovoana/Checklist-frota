-- ============================================================
-- Checklist Frota — "Criar OS automática" por item
-- Rode isto no SQL Editor do Supabase do projeto
-- xgxghkksoezmgncpanpy (idempotente — pode rodar mais de uma vez)
-- ============================================================

-- 1. Novo campo no cadastro de itens: quando marcado, todo item
--    marcado NOK num checklist gera automaticamente uma Ordem de
--    Serviço urgente pro veículo.
alter table itens
  add column if not exists criar_os boolean not null default false;

-- 2. Novo campo na Ordem de Serviço pra guardar os links das fotos
--    (mesmo padrão de "url1 | url2 | url3" já usado em
--    checklist_itens.foto_link) — preenchido automaticamente com as
--    fotos do item do checklist que originou a OS, se houver.
alter table ordens_servico
  add column if not exists foto_link text;
