-- Three-tier plans: emprendedor | negocio | cadena
UPDATE "Tenant" SET plan = 'emprendedor' WHERE plan = 'basic';
UPDATE "Tenant" SET plan = 'negocio' WHERE plan = 'pro';

ALTER TABLE "Tenant" ALTER COLUMN "plan" SET DEFAULT 'emprendedor';
