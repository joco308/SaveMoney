
BEGIN;

-- =========================================
-- PERFIL DE USUARIO
-- =========================================

INSERT INTO perfil_usuario (
    id_perfil,
    nombre,
    descripcion
)
VALUES (
    1,
    'Usuario',
    'Usuario estándar de la aplicación SaveMoney'
)
ON CONFLICT (id_perfil) DO NOTHING;

-- =========================================
-- MONEDAS
-- =========================================

INSERT INTO moneda (codigo_moneda, nombre, simbolo)
VALUES
    ('BOB', 'Boliviano', 'Bs'),
    ('USD', 'Dólar estadounidense', '$'),
    ('EUR', 'Euro', '€')
ON CONFLICT (codigo_moneda) DO NOTHING;

COMMIT;

-- =========================================
-- VERIFICAR DATOS INSERTADOS
-- =========================================

SELECT * FROM perfil_usuario ORDER BY id_perfil;

SELECT * FROM moneda ORDER BY codigo_moneda;
