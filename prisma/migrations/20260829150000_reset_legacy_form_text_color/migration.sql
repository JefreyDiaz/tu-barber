-- El color #1c1917 era el default antiguo de textColor; ahora es solo para botones.
UPDATE "TenantSettings"
SET "textColor" = NULL
WHERE LOWER(TRIM("textColor")) = '#1c1917';
