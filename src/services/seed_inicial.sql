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

-- =========================================
-- TIPOS DE MOVIMIENTO
-- =========================================

INSERT INTO tipo_movimiento (id_tipo_movimiento, nombre)
VALUES
    (1, 'Ingreso'),
    (2, 'Egreso')
ON CONFLICT (id_tipo_movimiento) DO NOTHING;

-- =========================================
-- TIPOS DE CATEGORIA
-- =========================================

INSERT INTO tipo_categoria (
    id_tipo_categoria,
    nombre,
    id_tipo_movimiento
)
VALUES
    (1, 'Ingresos', 1),
    (2, 'Gastos', 2)
ON CONFLICT (id_tipo_categoria) DO NOTHING;

-- =========================================
-- CATEGORIAS GLOBALES
-- =========================================

INSERT INTO categoria (
    id_tipo_categoria,
    nombre,
    activa
)
SELECT datos.id_tipo_categoria, datos.nombre, TRUE
FROM (
    VALUES
        (1, 'Salario'),
        (1, 'Ventas'),
        (1, 'Otros ingresos'),
        (2, 'Alimentación'),
        (2, 'Transporte'),
        (2, 'Vivienda'),
        (2, 'Salud'),
        (2, 'Educación'),
        (2, 'Servicios'),
        (2, 'Entretenimiento'),
        (2, 'Otros gastos')
) AS datos(id_tipo_categoria, nombre)
WHERE NOT EXISTS (
    SELECT 1
    FROM categoria c
    WHERE c.id_tipo_categoria = datos.id_tipo_categoria
      AND c.nombre = datos.nombre
      AND c.id_usuario IS NULL
);

-- =========================================
-- METODOS DE PAGO
-- =========================================

INSERT INTO metodo_pago (id_metodo_pago, nombre)
VALUES
    (1, 'Efectivo'),
    (2, 'Tarjeta de débito'),
    (3, 'Tarjeta de crédito'),
    (4, 'Transferencia'),
    (5, 'QR')
ON CONFLICT (id_metodo_pago) DO NOTHING;

-- =========================================
-- ESTADOS DE METAS DE AHORRO
-- =========================================

INSERT INTO estado_meta (id_estado_meta, nombre)
VALUES
    (1, 'Activa'),
    (2, 'Completada'),
    (3, 'Cancelada'),
    (4, 'Vencida')
ON CONFLICT (id_estado_meta) DO NOTHING;

COMMIT;

-- =========================================
-- VERIFICAR DATOS INSERTADOS
-- =========================================

SELECT * FROM perfil_usuario ORDER BY id_perfil;

SELECT * FROM moneda ORDER BY codigo_moneda;

SELECT * FROM tipo_movimiento ORDER BY id_tipo_movimiento;

SELECT * FROM tipo_categoria ORDER BY id_tipo_categoria;

SELECT * FROM categoria ORDER BY id_categoria;

SELECT * FROM metodo_pago ORDER BY id_metodo_pago;

-- ESTADOS DE COMPRAS IMPULSIVAS
INSERT INTO estado_espera (id_estado_espera, nombre)
VALUES
    (1, 'En espera'),
    (2, 'Comprada'),
    (3, 'Descartada')
ON CONFLICT (id_estado_espera) DO NOTHING;

-- =========================================
-- TIPOS DE ALERTAS
-- =========================================

INSERT INTO tipo_alerta (id_tipo_alerta, codigo, descripcion)
VALUES
    (1, 'PRESUPUESTO_UMBRAL',
     'Se alcanzó el porcentaje de alerta del presupuesto mensual'),
    (2, 'LIMITE_CATEGORIA_UMBRAL',
     'Se alcanzó el porcentaje de alerta del límite de una categoría')
ON CONFLICT (id_tipo_alerta) DO NOTHING;


INSERT INTO tipo_alerta (id_tipo_alerta, codigo, descripcion)
VALUES
    (3, 'META_COMPLETADA',
     'Se completó una meta de ahorro'),
    (4, 'COMPRA_ESPERA_FINALIZADA',
     'Finalizó el período de espera de una compra impulsiva')
ON CONFLICT (id_tipo_alerta) DO NOTHING;
