-- =============================================================================
-- C-KREA PAYCONTROL — SEED DATA (Step 6)
-- Generated from: ckrea.xlsx (Ocupacion, Cartera) + C-KREA GB.xlsx (Proyecciones)
-- Date: 2026-04-16
-- Description: Real production data for ~85 units, tenants, contracts,
--              monthly projections, cartera snapshot, financial rules,
--              and gasto types.
-- =============================================================================

-- Run AFTER 001_initial_schema.sql
-- This script is idempotent (uses ON CONFLICT where possible)

BEGIN;

-- =============================================================================
-- 1. COMPANY: C-Krea
-- =============================================================================

INSERT INTO companies (id, name, nit, siesa_co_id, siesa_ccosto, siesa_canal_id)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Central Kreativa (C-Krea)',
    '900123456',
    '044',
    '285',
    'R08'
) ON CONFLICT (nit) DO NOTHING;

-- Variable for FK references
DO $$ BEGIN PERFORM set_config('seed.company_id', '00000000-0000-0000-0000-000000000001', false); END $$;


-- =============================================================================
-- 2. TENANTS (from ckrea.xlsx Ocupacion — deduplicated by NIT)
-- =============================================================================

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901923367',
    'MEDIOS IMPRESOS S.A.S.',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901447921',
    'VISUAL GRAPHIC SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901355569',
    'PLANETA GRAFICO SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901527831',
    'MARKCREATIVA SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '900945593',
    'SOLUCIONES GRAFICAS ATR SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901148181',
    'PRODUCTOR DE HERRAJES COLOMBIANOS SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '1012395837',
    'BUSTOS URIBE CARLOS ANDRES',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000008'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901754006',
    'THE PELICULA PUBLICIDAD SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000009'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '80230902',
    'ALARCON PIRACHICAN JOHN FREDDY',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000010'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '1000124845',
    'NIETO VILLALBA HEIDY DAYANA',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901104108',
    'ACRIGROUP DISEÑO Y PUBLICIDAD SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000012'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '1022353684',
    'SANABRIA FRANKY MARIA ANGELICA',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000013'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901925801',
    'TICETTE STILE SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000014'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901800678',
    'TURISMO MAGICO S&M SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000015'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '80186910',
    'LASSO MONTENEGRO LUIS FERNANDO',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000016'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901972914',
    'INKU.CA SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000017'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901123749',
    'PUBLISERVIS SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000018'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '900960003',
    'GO CREATIVE SAS',
    'CREDITO A 10 DIAS',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000019'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '900984500',
    'FUSION GRAFIK SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000020'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901953695',
    'NEOGRAFICK S.A.S.',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000021'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '900700059',
    'AGENCIA GRAFISIGLO 21 SAS',
    'CREDITO A 10 DIAS',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000022'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901455753',
    'CICLO CREATIVO SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000023'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '900809088',
    'IMAGENN & PUNTO SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000024'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901014593',
    'IMPROEXPRESS SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000025'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901246448',
    'MI MUG SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000026'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '1030528276',
    'RINCON PINZON MARGIE KATHERINE',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000027'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '52588389',
    'PATARROYO PAEZ ADRIANA YAZMIN',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000028'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '79799324',
    'LEAL GALARZA HENRY',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000029'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '19471923',
    'GALINDO ROA JOSE POLIDORO',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000030'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '1013647858',
    'PUENTES DENARVAEZ ASTRID CAROLINA',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000031'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901729544',
    'REBELARTE COMUNICACION VISUAL SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000032'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '900980560',
    'PRIORITY PRINT SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000033'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '1005702776',
    'HERNANDEZ CRUZ YEIDY ALEJANDRA',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000034'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901906775',
    'NC GRAPHICS S.A.S.',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000035'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '53113929',
    'MARTINEZ CADENA DORA CONSTANZA',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000036'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901158612',
    'ACRILICOS INFINITO SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000037'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '51738650',
    'BECERRA MATEUS AGUSTINA',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000038'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901858219',
    'MUISCAS PUBLICIDAD S.A.S',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000039'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901007628',
    'POP PUBLICIDAD & PROMOCIONALES SAS',
    'CREDITO A 10 DIAS',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000040'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '1023870097',
    'FAJARDO NIVIA RENATO ALEJANDRO',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000041'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '1023880827',
    'CASTIBLANCO CLAROS HAROLD GUSTAVO',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000042'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '1022976504',
    'ARRIERO LUNA ANDRES ESNEIDER',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000043'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '6191344',
    'ANZOLA LOYO ANYERBERT ARTURO',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000044'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '1013579412',
    'RUIZ FRANCO EDER DAVID',
    'CREDITO A 10 DIAS',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000045'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901844054',
    'SAVATAR PUBLICIDAD SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000046'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '900673258',
    'IN - DESIGN SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000047'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '63539677',
    'TRIANA ESTUPIÑAN PAULA INES',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000048'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901062443',
    'DISEÑOS Y SELLADOS BASTIDAS SAS',
    'CREDITO A 10 DIAS',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000049'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '900547519',
    'MATICES COMUNICACION VISUAL SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000050'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901279914',
    'RUEFIN GROUP SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000051'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '1030682185',
    'ACEVEDO RIVEROS DAHYAN STEFANY',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000052'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '1023915663',
    'MORALES CLAVIJO JUAN FELIPE',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000053'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '1032461335',
    'RAMIREZ JIMENEZ JEISON STEVEN',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000054'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '1032423554',
    'RODRIGUEZ MURILLO JAVIER',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000055'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901429453',
    'KIADOM AGENCIA CREATIVA SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000056'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '1506253',
    'SALAS MONCADA YAMIL RAFAEL',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000057'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '1032409826',
    'RODRIGUEZ CARRERO DIANA CATHERINE',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000058'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901758449',
    'OKAR DISTRIBUCIONES SAS',
    'CREDITO A 10 DIAS PP 10%',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;

INSERT INTO tenants (id, company_id, nit, razon_social, condicion_pago, is_active)
VALUES (
    '10000000-0000-0000-0000-000000000059'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '901456434',
    'CODIGO PURPURA SA',
    'CREDITO A 10 DIAS',
    true
) ON CONFLICT (company_id, nit) DO NOTHING;


-- =============================================================================
-- 3. UNITS (from ckrea.xlsx Ocupacion + C-KREA GB metadata)
-- =============================================================================

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '101',
    'E1L101',
    'ENTRADA 1 ',
    '1A',
    1,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '106',
    'E1L106',
    'ENTRADA 1 ',
    'C',
    6,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '112',
    'E1L112',
    'ENTRADA 1 ',
    '1A',
    12,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '115',
    'E1L115',
    'ENTRADA 1 ',
    'B',
    15,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '119',
    'E1L119',
    'ENTRADA 1 ',
    '1A',
    19,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '209',
    'E2L209',
    'ENTRADA 2 ',
    '1A',
    33,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '214',
    'E2L214',
    'ENTRADA 2 ',
    '1A',
    36,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000008'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '304',
    'E3L304',
    'ENTRADA 3 ',
    '1A',
    75,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000009'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '312',
    'E3L312',
    'ENTRADA 3 ',
    'C',
    46,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000010'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '124',
    'E1L124',
    'ENTRADA 1 ',
    '1A',
    24,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '202',
    'E2L202',
    'ENTRADA 2 ',
    'C',
    27,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000012'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '204',
    'E2L204',
    'ENTRADA 2 ',
    'C',
    28,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000013'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '308',
    'E3L308',
    'ENTRADA 3 ',
    '1A',
    42,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000014'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '309',
    'E3L309',
    'ENTRADA 3 ',
    '1A',
    43,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000015'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '503',
    'E5L503',
    'ENTRADA 5 ',
    'C',
    54,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000016'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '507',
    'E5L507',
    'ENTRADA 5 ',
    '1A',
    57,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000017'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '517',
    'E5L517',
    'ENTRADA 5 ',
    '1A',
    63,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000018'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '802',
    'Z8L802',
    'ZONA 8 ',
    'A',
    68,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000019'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '113',
    'E1L113',
    'ENTRADA 1 ',
    '1A',
    13,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000020'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '117',
    'E1L117',
    'ENTRADA 1 ',
    'C',
    17,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000021'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '121',
    'E1L121',
    'ENTRADA 1 ',
    '1A',
    21,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000022'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '212',
    'E2L212',
    'ENTRADA 2 ',
    '1A',
    74,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000023'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '506A',
    'E5L506A',
    'ENTRADA 5 ',
    'B',
    76,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000024'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '516',
    'E5L516',
    'ENTRADA 5 ',
    'C',
    62,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000025'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '110',
    'E1L110',
    'ENTRADA 1 ',
    'C',
    10,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000026'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '201',
    'E2L201',
    'ENTRADA 2 ',
    '1A',
    73,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000027'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '301',
    'E3L301',
    'ENTRADA 3 ',
    'B',
    37,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000028'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '310',
    'E3L310',
    'ENTRADA 3 ',
    '1A',
    44,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000029'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '415',
    'E4L415',
    'ENTRADA 4 ',
    '1A',
    50,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000030'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '501',
    'E5L501',
    'ENTRADA 5 ',
    'C',
    52,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000031'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '504',
    'E5L504',
    'ENTRADA 5 ',
    'A',
    55,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000032'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '508',
    'E5L508',
    'ENTRADA 5 ',
    'C',
    78,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000033'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '513',
    'E5L513',
    'ENTRADA 5 ',
    'C',
    60,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000034'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '514',
    'E5L514',
    'ENTRADA 5 ',
    'C',
    78,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000035'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '515',
    'E5L515',
    'ENTRADA 5 ',
    'A',
    61,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000036'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '803',
    'Z8L803',
    'ZONA 8 ',
    '1A',
    69,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000037'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '805',
    'Z8L805',
    'ZONA 8 ',
    '1A',
    71,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000038'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '102',
    'E1L102',
    'ENTRADA 1 ',
    '1A',
    2,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000039'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '103',
    'E1L103',
    'ENTRADA 1 ',
    '1A',
    3,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000040'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '105',
    'E1L105',
    'ENTRADA 1 ',
    '1A',
    5,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000041'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '107',
    'E1L107',
    'ENTRADA 1 ',
    '1A',
    7,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000042'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '109',
    'E1L109',
    'ENTRADA 1 ',
    '1A',
    9,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000043'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '111',
    'E1L111',
    'ENTRADA 1 ',
    'C',
    11,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000044'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '116',
    'E1L116',
    'ENTRADA 1 ',
    'B',
    16,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000045'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '120',
    'E1L120',
    'ENTRADA 1 ',
    '1A',
    20,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000046'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '122',
    'E1L122',
    'ENTRADA 1 ',
    '1A',
    22,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000047'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '206',
    'E2L206',
    'ENTRADA 2 ',
    'A',
    30,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000048'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '210',
    'E2L210',
    'ENTRADA 2 ',
    '1A',
    74,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000049'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '302',
    'E3L302',
    'ENTRADA 3 ',
    'B',
    38,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000050'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '307',
    'E3L307',
    'ENTRADA 3 ',
    '1A',
    41,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000051'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '416',
    'E4L416',
    'ENTRADA 4 ',
    '1A',
    51,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000052'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '502',
    'E5L502',
    'ENTRADA 5 ',
    'C',
    53,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000053'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '519',
    'E5L519',
    'ENTRADA 5 ',
    'C',
    65,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000054'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '806',
    'Z8L806',
    'ZONA 8 ',
    'ADMINISTRACION',
    0,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000055'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '104',
    'E1L104',
    'ENTRADA 1 ',
    '1A',
    4,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000056'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '108',
    'E1L108',
    'ENTRADA 1 ',
    'C',
    8,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000057'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '207',
    'E2L207',
    'ENTRADA 2 ',
    'A',
    31,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000058'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '211',
    'E2L211',
    'ENTRADA 2 ',
    '1A',
    34,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000059'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '306',
    'E3L306',
    'ENTRADA 3 ',
    '1A',
    75,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000060'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '311',
    'E3L311',
    'ENTRADA 3 ',
    '1A',
    45,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000061'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '414',
    'E4L414',
    'ENTRADA 4 ',
    'A',
    49,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000062'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '518',
    'E5L518',
    'ENTRADA 5 ',
    '1A',
    64,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000063'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '804',
    'Z8L804',
    'ZONA 8 ',
    'A',
    70,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000064'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '114',
    'E1L114',
    'ENTRADA 1 ',
    'B',
    14,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000065'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '118',
    'E1L118',
    'ENTRADA 1 ',
    '1A',
    18,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000066'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '125',
    'E1L125',
    'ENTRADA 1 ',
    '1A',
    25,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000067'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '203',
    'E2L203',
    'ENTRADA 2 ',
    '1A',
    73,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000068'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '208',
    'E2L208',
    'ENTRADA 2 ',
    '1A',
    32,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000069'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '213',
    'E2L213',
    'ENTRADA 2 ',
    '1A',
    35,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000070'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '303',
    'E3L303',
    'ENTRADA 3 ',
    '1A',
    39,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000071'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '505',
    'E5L505',
    'ENTRADA 5 ',
    '1A',
    56,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000072'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '506B',
    'E5L506B',
    'ENTRADA 5 ',
    'B',
    77,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000073'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '509',
    'E5L509',
    'ENTRADA 5 ',
    '1A',
    58,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000074'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '510',
    'E5L510',
    'ENTRADA 5 ',
    'C',
    78,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000075'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '511',
    'E5L511',
    'ENTRADA 5 ',
    '1A',
    59,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000076'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '520',
    'E5L520',
    'ENTRADA 5 ',
    '1A',
    66,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000077'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '123',
    'E1L123',
    'ENTRADA 1 ',
    '1A',
    23,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000078'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '205',
    'E2L205',
    'ENTRADA 2 ',
    '1A',
    29,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000079'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '305',
    'E3L305',
    'ENTRADA 3 ',
    '1A',
    40,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000080'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '313',
    'E3L313',
    'ENTRADA 3 ',
    '1A',
    47,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000081'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '314',
    'E3L314',
    'ENTRADA 3 ',
    '1A',
    48,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000082'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '512',
    'E5L512',
    'ENTRADA 5 ',
    'C',
    78,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000083'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '801',
    'Z8L801',
    'ZONA 8 ',
    'A',
    67,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, factura_consecutivo, status)
VALUES (
    '20000000-0000-0000-0000-000000000084'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '807',
    'Z8L807',
    'ZONA 8 ',
    '1A',
    72,
    'arrendado'
) ON CONFLICT (company_id, unit_number) DO NOTHING;


-- Unit 126: DISPONIBLE (no active tenant in Siesa, listed in projections)
INSERT INTO units (id, company_id, unit_number, unit_code, entrada, clasificacion, status)
VALUES (
    '20000000-0000-0000-0000-000000000085'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '126',
    'E1L126',
    'ENTRADA 1',
    'DISPONIBLE',
    'disponible'
) ON CONFLICT (company_id, unit_number) DO NOTHING;

-- Projections for unit 126 (all zeros - available unit)
INSERT INTO projections (company_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
SELECT '00000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000085'::uuid, 2026, m, 0, 0, 0
FROM generate_series(1,12) AS m
ON CONFLICT (unit_id, year, month) DO NOTHING;


-- =============================================================================
-- 4. CONTRACTS (Ocupacion + C-KREA GB projection metadata)
-- =============================================================================

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000001'::uuid,
    '2025-04-01',
    'ACK',
    5450000.0,
    277950.0,
    '2026-10-01',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000002'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    '2024-02-02',
    'ACK',
    3100450.0,
    150450.0,
    '2026-02-15',
    0.0,
    20.0,
    'activo',
    'Enero 10 pp',
    false, true, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000003'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000003'::uuid,
    '20000000-0000-0000-0000-000000000003'::uuid,
    '2025-06-10',
    'ACK',
    1812975.0,
    87975.0,
    '2026-01-01',
    0.0,
    10.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000004'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000004'::uuid,
    '20000000-0000-0000-0000-000000000004'::uuid,
    '2023-03-01',
    'ACK',
    3650000.0,
    186150.0,
    '2026-08-01',
    0.0,
    10.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000005'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000005'::uuid,
    '20000000-0000-0000-0000-000000000005'::uuid,
    '2025-09-02',
    'ACK',
    3650000.0,
    186150.0,
    '2026-09-15',
    0.0,
    10.0,
    'activo',
    'Enero 30% + 10% pp hasta abril',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000006'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000006'::uuid,
    '20000000-0000-0000-0000-000000000006'::uuid,
    '2024-05-06',
    'ACK',
    2350000.0,
    119849.99999999999,
    '2026-06-01',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000007'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000007'::uuid,
    '20000000-0000-0000-0000-000000000007'::uuid,
    '2024-03-07',
    'ACK',
    3040543.0,
    147543.0,
    '2026-03-01',
    0.0,
    30.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000008'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000008'::uuid,
    '20000000-0000-0000-0000-000000000008'::uuid,
    '2024-02-02',
    'ACK',
    2364750.0,
    219300.0,
    '2026-04-01',
    0.0,
    10.0,
    'activo',
    'Enero 20% + 10 pp hasta marzo',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000009'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000009'::uuid,
    '20000000-0000-0000-0000-000000000009'::uuid,
    '2024-11-29',
    'ACK',
    2150000.0,
    109650.0,
    '2026-12-01',
    0.0,
    10.0,
    'critico',
    'Enero 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000010'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000010'::uuid,
    '20000000-0000-0000-0000-000000000010'::uuid,
    '2023-12-14',
    'ACK',
    3205550.0,
    155550.0,
    '2026-02-01',
    0.0,
    10.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000011'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000011'::uuid,
    '20000000-0000-0000-0000-000000000011'::uuid,
    '2023-01-12',
    'ACK',
    3482804.0,
    169003.8,
    '2026-03-01',
    0.0,
    10.0,
    'critico',
    'Enero 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000012'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000012'::uuid,
    '20000000-0000-0000-0000-000000000012'::uuid,
    '2023-01-12',
    'ACK',
    1437348.0,
    69747.59999999999,
    '2026-03-01',
    0.0,
    10.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000013'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000013'::uuid,
    '20000000-0000-0000-0000-000000000013'::uuid,
    '2025-05-06',
    'ACK',
    2262000.0,
    115361.99999999999,
    '2026-06-15',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000014'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000014'::uuid,
    '20000000-0000-0000-0000-000000000014'::uuid,
    '2025-05-06',
    'ACK',
    2262000.0,
    115361.99999999999,
    '2026-06-15',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000015'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000015'::uuid,
    '20000000-0000-0000-0000-000000000016'::uuid,
    '2025-04-21',
    'ACK',
    2995350.0,
    145350.0,
    '2026-04-15',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000016'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000016'::uuid,
    '20000000-0000-0000-0000-000000000017'::uuid,
    '2025-11-05',
    'ACK',
    2850000.0,
    145350.0,
    '2026-12-01',
    30.0,
    10.0,
    'activo',
    'Enero 30% + 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000017'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000017'::uuid,
    '20000000-0000-0000-0000-000000000018'::uuid,
    '2023-05-19',
    'ACK',
    2367000.0,
    120716.99999999999,
    '2026-08-01',
    0.0,
    10.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000018'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000018'::uuid,
    '20000000-0000-0000-0000-000000000019'::uuid,
    '2024-02-02',
    'ACK',
    3836150.0,
    186150.0,
    '2026-03-01',
    0.0,
    0.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000019'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000019'::uuid,
    '20000000-0000-0000-0000-000000000020'::uuid,
    '2023-05-10',
    'ACK',
    3839800.0,
    195829.8,
    '2026-06-01',
    0.0,
    10.0,
    'critico',
    'Enero 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000020'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000020'::uuid,
    '20000000-0000-0000-0000-000000000021'::uuid,
    '2026-02-04',
    'ACK',
    3150000.0,
    160650.0,
    '2026-06-01',
    10.0,
    20.0,
    'activo',
    'Enero 20% +10 pp hasta junio y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000021'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000021'::uuid,
    '20000000-0000-0000-0000-000000000022'::uuid,
    '2023-03-30',
    'ACK',
    3050000.0,
    0,
    NULL,
    0.0,
    0.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000022'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000022'::uuid,
    '20000000-0000-0000-0000-000000000023'::uuid,
    '2024-10-31',
    'ACK',
    2154550.0,
    104550.0,
    '2026-04-01',
    10.0,
    10.0,
    'critico',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000023'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000023'::uuid,
    '20000000-0000-0000-0000-000000000024'::uuid,
    '2023-06-29',
    'ACK',
    3208600.0,
    163638.59999999998,
    '2026-09-01',
    0.0,
    10.0,
    'critico',
    'Enero 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000024'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000024'::uuid,
    '20000000-0000-0000-0000-000000000025'::uuid,
    '2023-01-12',
    'ACK',
    3150000.0,
    160650.0,
    '2026-12-01',
    10.0,
    10.0,
    'critico',
    'Enero 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000025'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000025'::uuid,
    '20000000-0000-0000-0000-000000000026'::uuid,
    '2024-04-02',
    'ACK',
    3150000.0,
    298350.0,
    '2026-07-01',
    10.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta junio y luego 10 pp',
    false, true, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000026'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000026'::uuid,
    '20000000-0000-0000-0000-000000000027'::uuid,
    '2023-04-25',
    'ACK',
    2850000.0,
    145350.0,
    '2026-08-01',
    0.0,
    20.0,
    'critico',
    'Enero 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000027'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000027'::uuid,
    '20000000-0000-0000-0000-000000000028'::uuid,
    '2025-02-26',
    'ACK',
    2364750.0,
    114749.99999999999,
    '2026-03-01',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta junio y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000028'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000028'::uuid,
    '20000000-0000-0000-0000-000000000029'::uuid,
    '2025-01-22',
    'ACK',
    1839250.0,
    89250.0,
    '2026-02-01',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000029'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000011'::uuid,
    '20000000-0000-0000-0000-000000000030'::uuid,
    '2023-01-12',
    'ACK',
    3629400.0,
    185099.4,
    '2026-05-01',
    0.0,
    10.0,
    'critico',
    'Enero 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000030'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000017'::uuid,
    '20000000-0000-0000-0000-000000000031'::uuid,
    '2023-05-19',
    'ACK',
    2998200.0,
    152908.19999999998,
    '2026-07-01',
    0.0,
    10.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000031'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000023'::uuid,
    '20000000-0000-0000-0000-000000000032'::uuid,
    '2023-06-29',
    'ACK',
    2995350.0,
    576759.0,
    '1970-01-01',
    0.0,
    10.0,
    'critico',
    'Enero 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000032'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000029'::uuid,
    '20000000-0000-0000-0000-000000000033'::uuid,
    '2024-11-21',
    'ACK',
    3100450.0,
    150450.0,
    '2026-12-01',
    10.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta junio y luego 10 pp',
    false, false, true, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000033'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000023'::uuid,
    '20000000-0000-0000-0000-000000000034'::uuid,
    '2023-06-29',
    'ACK',
    2743350.0,
    0,
    NULL,
    0.0,
    10.0,
    'critico',
    'Enero 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000034'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000030'::uuid,
    '20000000-0000-0000-0000-000000000035'::uuid,
    '2024-06-05',
    'ACK',
    2750000.0,
    140250.0,
    '2026-07-01',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000035'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000031'::uuid,
    '20000000-0000-0000-0000-000000000036'::uuid,
    '2023-08-10',
    'ACK',
    1523950.0,
    73950.0,
    '2026-03-01',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000036'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000031'::uuid,
    '20000000-0000-0000-0000-000000000037'::uuid,
    '2023-08-10',
    'ACK',
    1472800.0,
    75112.79999999999,
    '2026-09-15',
    0.0,
    10.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000037'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000032'::uuid,
    '20000000-0000-0000-0000-000000000038'::uuid,
    '2023-01-12',
    'ACK',
    1934891.0,
    93891.0,
    '2026-03-01',
    0.0,
    10.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000038'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000033'::uuid,
    '20000000-0000-0000-0000-000000000039'::uuid,
    '2024-10-30',
    'ACK',
    4350000.0,
    221850.0,
    '2026-11-01',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000039'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000034'::uuid,
    '20000000-0000-0000-0000-000000000040'::uuid,
    '2025-12-01',
    'ACK',
    3650000.0,
    186150.0,
    '2026-08-01',
    20.0,
    10.0,
    'activo',
    'Enero 20 % hasta Julio',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000040'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000035'::uuid,
    '20000000-0000-0000-0000-000000000041'::uuid,
    '2023-06-14',
    'ACK',
    3650000.0,
    186150.0,
    '2026-11-01',
    10.0,
    10.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000041'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000035'::uuid,
    '20000000-0000-0000-0000-000000000042'::uuid,
    '2023-06-14',
    'ACK',
    1893600.0,
    96573.59999999999,
    '2026-08-01',
    0.0,
    10.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000042'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000036'::uuid,
    '20000000-0000-0000-0000-000000000044'::uuid,
    '2023-05-09',
    'ACK',
    3839800.0,
    195829.8,
    '2026-07-15',
    0.0,
    10.0,
    'critico',
    'Enero 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000043'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000037'::uuid,
    '20000000-0000-0000-0000-000000000045'::uuid,
    '2024-01-03',
    'ACK',
    6100000.0,
    155550.0,
    '2026-11-01',
    0.0,
    10.0,
    'critico',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000044'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000038'::uuid,
    '20000000-0000-0000-0000-000000000046'::uuid,
    '2025-07-22',
    '999',
    3050000.0,
    155550.0,
    '2026-08-01',
    10.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta junio y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000045'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000039'::uuid,
    '20000000-0000-0000-0000-000000000047'::uuid,
    '2023-03-01',
    'ACK',
    2708847.0,
    131447.4,
    '2026-03-01',
    0.0,
    0.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000046'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000021'::uuid,
    '20000000-0000-0000-0000-000000000048'::uuid,
    '2023-03-30',
    'ACK',
    2167920.0,
    266113.92,
    '2026-08-01',
    0.0,
    0.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000047'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000040'::uuid,
    '20000000-0000-0000-0000-000000000049'::uuid,
    '2023-01-12',
    'ACK',
    3100450.0,
    150450.0,
    '2026-04-01',
    0.0,
    10.0,
    'critico',
    'Enero 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000048'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000041'::uuid,
    '20000000-0000-0000-0000-000000000050'::uuid,
    '2025-06-04',
    'ACK',
    2157000.0,
    110007.0,
    '2026-06-01',
    10.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta junio y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000049'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000031'::uuid,
    '20000000-0000-0000-0000-000000000051'::uuid,
    '2023-08-10',
    'ACK',
    2700000.0,
    137700.0,
    '2026-06-01',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta junio y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000050'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000042'::uuid,
    '20000000-0000-0000-0000-000000000052'::uuid,
    '2024-10-04',
    'ACK',
    3450000.0,
    175950.0,
    '2026-10-01',
    20.0,
    10.0,
    'critico',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000051'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000043'::uuid,
    '20000000-0000-0000-0000-000000000053'::uuid,
    '2024-10-21',
    'ACK',
    2850000.0,
    145350.0,
    '2026-11-01',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    false, false, true, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000052'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000044'::uuid,
    '20000000-0000-0000-0000-000000000055'::uuid,
    '2024-10-04',
    'ACK',
    3150000.0,
    160650.0,
    '2026-10-01',
    20.0,
    0.0,
    'activo',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000053'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000024'::uuid,
    '20000000-0000-0000-0000-000000000056'::uuid,
    '2023-01-12',
    'ACK',
    1547913.0,
    75112.79999999999,
    '2026-03-01',
    0.0,
    10.0,
    'critico',
    'Enero 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000054'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000045'::uuid,
    '20000000-0000-0000-0000-000000000057'::uuid,
    '2024-09-02',
    'ACK',
    2367000.0,
    120716.99999999999,
    '2026-05-01',
    0.0,
    10.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000055'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000046'::uuid,
    '20000000-0000-0000-0000-000000000058'::uuid,
    '2024-04-02',
    'ACK',
    3650000.0,
    186150.0,
    '2026-05-01',
    20.0,
    20.0,
    'activo',
    'Enero 20% +10 pp hasta abril',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000056'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000008'::uuid,
    '20000000-0000-0000-0000-000000000059'::uuid,
    '2024-02-02',
    'ACK',
    2154550.0,
    0,
    NULL,
    0.0,
    10.0,
    'activo',
    'Enero 20% + 10 pp hasta marzo',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000057'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000047'::uuid,
    '20000000-0000-0000-0000-000000000061'::uuid,
    '2025-01-22',
    'ACK',
    1944350.0,
    94350.0,
    '2026-03-01',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000058'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000048'::uuid,
    '20000000-0000-0000-0000-000000000062'::uuid,
    '2023-08-02',
    'ACK',
    2998200.0,
    152908.19999999998,
    '2026-09-01',
    0.0,
    0.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000059'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000040'::uuid,
    '20000000-0000-0000-0000-000000000064'::uuid,
    '2023-01-12',
    'ACK',
    2377152.0,
    115351.79999999999,
    '2026-03-01',
    0.0,
    10.0,
    'critico',
    'Enero 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000060'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000065'::uuid,
    '2025-04-01',
    'ACK',
    3650000.0,
    186150.0,
    '2026-09-01',
    30.0,
    10.0,
    'activo',
    'Enero 30% + 10% pp hasta abril',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000061'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000049'::uuid,
    '20000000-0000-0000-0000-000000000066'::uuid,
    '2025-01-22',
    'ACK',
    2259650.0,
    109650.0,
    '2026-02-01',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000062'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000025'::uuid,
    '20000000-0000-0000-0000-000000000067'::uuid,
    '2024-04-02',
    'ACK',
    2700000.0,
    0,
    NULL,
    0.0,
    20.0,
    'activo',
    'Enero 20% +10 pp hasta junio y luego 10 pp',
    false, true, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000063'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000050'::uuid,
    '20000000-0000-0000-0000-000000000068'::uuid,
    '2025-08-27',
    'ACK',
    2893000.0,
    147543.0,
    '2026-08-15',
    30.0,
    10.0,
    'activo',
    'Enero 30% + 10% pp hasta abril',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000064'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000051'::uuid,
    '20000000-0000-0000-0000-000000000069'::uuid,
    '2024-06-05',
    'ACK',
    2950000.0,
    150450.0,
    '2026-07-01',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta junio y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000065'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000052'::uuid,
    '20000000-0000-0000-0000-000000000070'::uuid,
    '2023-03-01',
    'ACK',
    2367000.0,
    120716.99999999999,
    '2026-06-01',
    10.0,
    10.0,
    'critico',
    'Enero 20% +10 pp hasta junio y luego 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000066'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000022'::uuid,
    '20000000-0000-0000-0000-000000000072'::uuid,
    '2024-10-31',
    'ACK',
    2050000.0,
    104550.0,
    '2026-11-15',
    0.0,
    10.0,
    'critico',
    'Enero 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000067'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000053'::uuid,
    '20000000-0000-0000-0000-000000000073'::uuid,
    '2024-12-04',
    'ACK',
    2785150.0,
    135150.0,
    '2026-01-01',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000068'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000023'::uuid,
    '20000000-0000-0000-0000-000000000074'::uuid,
    '2023-06-29',
    'ACK',
    2732600.0,
    0,
    NULL,
    0.0,
    10.0,
    'critico',
    'Enero 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000069'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000054'::uuid,
    '20000000-0000-0000-0000-000000000075'::uuid,
    '2025-10-29',
    'ACK',
    2890250.0,
    140250.0,
    '2026-02-01',
    10.0,
    20.0,
    'activo',
    'Enero 20% +10 pp hasta junio y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000070'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000055'::uuid,
    '20000000-0000-0000-0000-000000000076'::uuid,
    '2023-06-14',
    'ACK',
    2893000.0,
    147543.0,
    '2026-08-01',
    0.0,
    10.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000071'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000049'::uuid,
    '20000000-0000-0000-0000-000000000077'::uuid,
    '2025-01-22',
    'ACK',
    2364750.0,
    114749.99999999999,
    '2026-02-01',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta mayo y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000072'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000052'::uuid,
    '20000000-0000-0000-0000-000000000078'::uuid,
    '2023-03-01',
    'ACK',
    2487717.0,
    120716.99999999999,
    '2026-03-01',
    0.0,
    10.0,
    'critico',
    'Enero 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000073'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000056'::uuid,
    '20000000-0000-0000-0000-000000000079'::uuid,
    '2024-09-03',
    'ACK',
    2157000.0,
    110007.0,
    '2026-09-01',
    20.0,
    10.0,
    'activo',
    'Enero 20% +10 pp hasta junio y luego 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000074'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000057'::uuid,
    '20000000-0000-0000-0000-000000000080'::uuid,
    '2025-08-27',
    'ACK',
    2250000.0,
    114749.99999999999,
    '2026-09-01',
    0.0,
    10.0,
    'critico',
    'Enero 30% + 10pp hasta marzo',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000075'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000058'::uuid,
    '20000000-0000-0000-0000-000000000081'::uuid,
    '2025-08-27',
    'ACK',
    2350000.0,
    119849.99999999999,
    '2026-09-01',
    10.0,
    10.0,
    'activo',
    'Enero 30% +10 pp hasta mayo',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000076'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000023'::uuid,
    '20000000-0000-0000-0000-000000000082'::uuid,
    '2023-06-29',
    'ACK',
    2837700.0,
    0,
    NULL,
    0.0,
    10.0,
    'critico',
    'Enero 10 pp',
    false, false, false, true
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000077'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000059'::uuid,
    '20000000-0000-0000-0000-000000000083'::uuid,
    '2023-05-16',
    'ACK',
    1420200.0,
    72430.2,
    '2026-08-01',
    0.0,
    0.0,
    'activo',
    'Enero 10 pp',
    true, false, false, false
);

INSERT INTO contracts (id, company_id, tenant_id, unit_id, fecha_inicio, lista_precios, canon_base,
    incremento_ipc, fecha_incremento_ipc, descuento_pct, pronto_pago_pct, status,
    descripcion_descuentos, flag_uno, flag_once, flag_veintiuno, flag_critico)
VALUES (
    '30000000-0000-0000-0000-000000000078'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000050'::uuid,
    '20000000-0000-0000-0000-000000000084'::uuid,
    '2025-08-27',
    'ACK',
    2550000.0,
    130049.99999999999,
    '2026-07-01',
    0.0,
    10.0,
    'activo',
    'Enero 30% + 10% pp hasta abril',
    true, false, false, false
);


-- =============================================================================
-- 5. PROJECTIONS — Monthly canon/descuento/PP per unit (C-KREA GB 2026)
-- 85 units × 12 months = 1,020 rows
-- =============================================================================

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000001'::uuid,
    2026, 1,
    5450000.0,
    1090000.0,
    436000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000001'::uuid,
    2026, 2,
    5450000.0,
    1090000.0,
    436000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000001'::uuid,
    2026, 3,
    5450000.0,
    1090000.0,
    436000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000001'::uuid,
    2026, 4,
    5450000.0,
    1090000.0,
    436000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000001'::uuid,
    2026, 5,
    5450000.0,
    1090000.0,
    436000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000001'::uuid,
    2026, 6,
    5450000.0,
    0.0,
    545000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000001'::uuid,
    2026, 7,
    5450000.0,
    0.0,
    545000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000001'::uuid,
    2026, 8,
    5450000.0,
    0.0,
    545000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000001'::uuid,
    2026, 9,
    5450000.0,
    0.0,
    545000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000001'::uuid,
    2026, 10,
    5727950.0,
    0.0,
    572795.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000001'::uuid,
    2026, 11,
    5727950.0,
    0.0,
    572795.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000001'::uuid,
    '20000000-0000-0000-0000-000000000001'::uuid,
    2026, 12,
    5727950.0,
    0.0,
    572795.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000037'::uuid,
    '20000000-0000-0000-0000-000000000038'::uuid,
    2026, 1,
    1841000.0,
    0.0,
    184100.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000037'::uuid,
    '20000000-0000-0000-0000-000000000038'::uuid,
    2026, 2,
    1841000.0,
    0.0,
    184100.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000037'::uuid,
    '20000000-0000-0000-0000-000000000038'::uuid,
    2026, 3,
    1934891.0,
    0.0,
    193489.1
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000037'::uuid,
    '20000000-0000-0000-0000-000000000038'::uuid,
    2026, 4,
    1934891.0,
    0.0,
    193489.1
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000037'::uuid,
    '20000000-0000-0000-0000-000000000038'::uuid,
    2026, 5,
    1934891.0,
    0.0,
    193489.1
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000037'::uuid,
    '20000000-0000-0000-0000-000000000038'::uuid,
    2026, 6,
    1934891.0,
    0.0,
    193489.1
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000037'::uuid,
    '20000000-0000-0000-0000-000000000038'::uuid,
    2026, 7,
    1934891.0,
    0.0,
    193489.1
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000037'::uuid,
    '20000000-0000-0000-0000-000000000038'::uuid,
    2026, 8,
    1934891.0,
    0.0,
    193489.1
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000037'::uuid,
    '20000000-0000-0000-0000-000000000038'::uuid,
    2026, 9,
    1934891.0,
    0.0,
    193489.1
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000037'::uuid,
    '20000000-0000-0000-0000-000000000038'::uuid,
    2026, 10,
    1934891.0,
    0.0,
    193489.1
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000037'::uuid,
    '20000000-0000-0000-0000-000000000038'::uuid,
    2026, 11,
    1934891.0,
    0.0,
    193489.1
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000037'::uuid,
    '20000000-0000-0000-0000-000000000038'::uuid,
    2026, 12,
    1934891.0,
    0.0,
    193489.1
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000038'::uuid,
    '20000000-0000-0000-0000-000000000039'::uuid,
    2026, 1,
    4350000.0,
    870000.0,
    348000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000038'::uuid,
    '20000000-0000-0000-0000-000000000039'::uuid,
    2026, 2,
    4350000.0,
    870000.0,
    348000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000038'::uuid,
    '20000000-0000-0000-0000-000000000039'::uuid,
    2026, 3,
    4350000.0,
    870000.0,
    348000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000038'::uuid,
    '20000000-0000-0000-0000-000000000039'::uuid,
    2026, 4,
    4350000.0,
    870000.0,
    348000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000038'::uuid,
    '20000000-0000-0000-0000-000000000039'::uuid,
    2026, 5,
    4350000.0,
    870000.0,
    348000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000038'::uuid,
    '20000000-0000-0000-0000-000000000039'::uuid,
    2026, 6,
    4350000.0,
    0.0,
    435000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000038'::uuid,
    '20000000-0000-0000-0000-000000000039'::uuid,
    2026, 7,
    4350000.0,
    0.0,
    435000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000038'::uuid,
    '20000000-0000-0000-0000-000000000039'::uuid,
    2026, 8,
    4350000.0,
    0.0,
    435000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000038'::uuid,
    '20000000-0000-0000-0000-000000000039'::uuid,
    2026, 9,
    4350000.0,
    0.0,
    435000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000038'::uuid,
    '20000000-0000-0000-0000-000000000039'::uuid,
    2026, 10,
    4350000.0,
    0.0,
    435000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000038'::uuid,
    '20000000-0000-0000-0000-000000000039'::uuid,
    2026, 11,
    4571850.0,
    0.0,
    457185.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000038'::uuid,
    '20000000-0000-0000-0000-000000000039'::uuid,
    2026, 12,
    4571850.0,
    0.0,
    457185.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000052'::uuid,
    '20000000-0000-0000-0000-000000000055'::uuid,
    2026, 1,
    3150000.0,
    630000.0,
    252000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000052'::uuid,
    '20000000-0000-0000-0000-000000000055'::uuid,
    2026, 2,
    3150000.0,
    630000.0,
    252000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000052'::uuid,
    '20000000-0000-0000-0000-000000000055'::uuid,
    2026, 3,
    3150000.0,
    630000.0,
    252000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000052'::uuid,
    '20000000-0000-0000-0000-000000000055'::uuid,
    2026, 4,
    3150000.0,
    630000.0,
    252000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000052'::uuid,
    '20000000-0000-0000-0000-000000000055'::uuid,
    2026, 5,
    3150000.0,
    630000.0,
    252000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000052'::uuid,
    '20000000-0000-0000-0000-000000000055'::uuid,
    2026, 6,
    3150000.0,
    0.0,
    315000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000052'::uuid,
    '20000000-0000-0000-0000-000000000055'::uuid,
    2026, 7,
    3150000.0,
    0.0,
    315000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000052'::uuid,
    '20000000-0000-0000-0000-000000000055'::uuid,
    2026, 8,
    3150000.0,
    0.0,
    315000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000052'::uuid,
    '20000000-0000-0000-0000-000000000055'::uuid,
    2026, 9,
    3150000.0,
    0.0,
    315000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000052'::uuid,
    '20000000-0000-0000-0000-000000000055'::uuid,
    2026, 10,
    3310650.0,
    0.0,
    331065.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000052'::uuid,
    '20000000-0000-0000-0000-000000000055'::uuid,
    2026, 11,
    3310650.0,
    0.0,
    331065.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000052'::uuid,
    '20000000-0000-0000-0000-000000000055'::uuid,
    2026, 12,
    3310650.0,
    0.0,
    331065.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000039'::uuid,
    '20000000-0000-0000-0000-000000000040'::uuid,
    2026, 1,
    3650000.0,
    730000.0,
    292000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000039'::uuid,
    '20000000-0000-0000-0000-000000000040'::uuid,
    2026, 2,
    3650000.0,
    730000.0,
    292000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000039'::uuid,
    '20000000-0000-0000-0000-000000000040'::uuid,
    2026, 3,
    3650000.0,
    730000.0,
    292000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000039'::uuid,
    '20000000-0000-0000-0000-000000000040'::uuid,
    2026, 4,
    3650000.0,
    730000.0,
    292000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000039'::uuid,
    '20000000-0000-0000-0000-000000000040'::uuid,
    2026, 5,
    3650000.0,
    730000.0,
    292000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000039'::uuid,
    '20000000-0000-0000-0000-000000000040'::uuid,
    2026, 6,
    3650000.0,
    730000.0,
    292000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000039'::uuid,
    '20000000-0000-0000-0000-000000000040'::uuid,
    2026, 7,
    3650000.0,
    730000.0,
    292000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000039'::uuid,
    '20000000-0000-0000-0000-000000000040'::uuid,
    2026, 8,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000039'::uuid,
    '20000000-0000-0000-0000-000000000040'::uuid,
    2026, 9,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000039'::uuid,
    '20000000-0000-0000-0000-000000000040'::uuid,
    2026, 10,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000039'::uuid,
    '20000000-0000-0000-0000-000000000040'::uuid,
    2026, 11,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000039'::uuid,
    '20000000-0000-0000-0000-000000000040'::uuid,
    2026, 12,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000002'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    2026, 1,
    2950000.0,
    0.0,
    295000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000002'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    2026, 2,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000002'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    2026, 3,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000002'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    2026, 4,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000002'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    2026, 5,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000002'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    2026, 6,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000002'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    2026, 7,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000002'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    2026, 8,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000002'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    2026, 9,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000002'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    2026, 10,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000002'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    2026, 11,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000002'::uuid,
    '20000000-0000-0000-0000-000000000002'::uuid,
    2026, 12,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000040'::uuid,
    '20000000-0000-0000-0000-000000000041'::uuid,
    2026, 1,
    3650000.0,
    365000.0,
    328500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000040'::uuid,
    '20000000-0000-0000-0000-000000000041'::uuid,
    2026, 2,
    3650000.0,
    365000.0,
    328500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000040'::uuid,
    '20000000-0000-0000-0000-000000000041'::uuid,
    2026, 3,
    3650000.0,
    365000.0,
    328500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000040'::uuid,
    '20000000-0000-0000-0000-000000000041'::uuid,
    2026, 4,
    3650000.0,
    365000.0,
    328500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000040'::uuid,
    '20000000-0000-0000-0000-000000000041'::uuid,
    2026, 5,
    3650000.0,
    365000.0,
    328500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000040'::uuid,
    '20000000-0000-0000-0000-000000000041'::uuid,
    2026, 6,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000040'::uuid,
    '20000000-0000-0000-0000-000000000041'::uuid,
    2026, 7,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000040'::uuid,
    '20000000-0000-0000-0000-000000000041'::uuid,
    2026, 8,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000040'::uuid,
    '20000000-0000-0000-0000-000000000041'::uuid,
    2026, 9,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000040'::uuid,
    '20000000-0000-0000-0000-000000000041'::uuid,
    2026, 10,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000040'::uuid,
    '20000000-0000-0000-0000-000000000041'::uuid,
    2026, 11,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000040'::uuid,
    '20000000-0000-0000-0000-000000000041'::uuid,
    2026, 12,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000053'::uuid,
    '20000000-0000-0000-0000-000000000056'::uuid,
    2026, 1,
    1472800.0,
    0.0,
    147280.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000053'::uuid,
    '20000000-0000-0000-0000-000000000056'::uuid,
    2026, 2,
    1472800.0,
    0.0,
    147280.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000053'::uuid,
    '20000000-0000-0000-0000-000000000056'::uuid,
    2026, 3,
    1547912.8,
    0.0,
    154791.28
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000053'::uuid,
    '20000000-0000-0000-0000-000000000056'::uuid,
    2026, 4,
    1547912.8,
    0.0,
    154791.28
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000053'::uuid,
    '20000000-0000-0000-0000-000000000056'::uuid,
    2026, 5,
    1547912.8,
    0.0,
    154791.28
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000053'::uuid,
    '20000000-0000-0000-0000-000000000056'::uuid,
    2026, 6,
    1547912.8,
    0.0,
    154791.28
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000053'::uuid,
    '20000000-0000-0000-0000-000000000056'::uuid,
    2026, 7,
    1547912.8,
    0.0,
    154791.28
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000053'::uuid,
    '20000000-0000-0000-0000-000000000056'::uuid,
    2026, 8,
    1547912.8,
    0.0,
    154791.28
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000053'::uuid,
    '20000000-0000-0000-0000-000000000056'::uuid,
    2026, 9,
    1547912.8,
    0.0,
    154791.28
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000053'::uuid,
    '20000000-0000-0000-0000-000000000056'::uuid,
    2026, 10,
    1547912.8,
    0.0,
    154791.28
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000053'::uuid,
    '20000000-0000-0000-0000-000000000056'::uuid,
    2026, 11,
    1547912.8,
    0.0,
    154791.28
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000053'::uuid,
    '20000000-0000-0000-0000-000000000056'::uuid,
    2026, 12,
    1547912.8,
    0.0,
    154791.28
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000041'::uuid,
    '20000000-0000-0000-0000-000000000042'::uuid,
    2026, 1,
    1893600.0,
    0.0,
    189360.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000041'::uuid,
    '20000000-0000-0000-0000-000000000042'::uuid,
    2026, 2,
    1893600.0,
    0.0,
    189360.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000041'::uuid,
    '20000000-0000-0000-0000-000000000042'::uuid,
    2026, 3,
    1893600.0,
    0.0,
    189360.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000041'::uuid,
    '20000000-0000-0000-0000-000000000042'::uuid,
    2026, 4,
    1893600.0,
    0.0,
    189360.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000041'::uuid,
    '20000000-0000-0000-0000-000000000042'::uuid,
    2026, 5,
    1893600.0,
    0.0,
    189360.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000041'::uuid,
    '20000000-0000-0000-0000-000000000042'::uuid,
    2026, 6,
    1893600.0,
    0.0,
    189360.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000041'::uuid,
    '20000000-0000-0000-0000-000000000042'::uuid,
    2026, 7,
    1893600.0,
    0.0,
    189360.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000041'::uuid,
    '20000000-0000-0000-0000-000000000042'::uuid,
    2026, 8,
    1990173.6,
    0.0,
    199017.36
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000041'::uuid,
    '20000000-0000-0000-0000-000000000042'::uuid,
    2026, 9,
    1990173.6,
    0.0,
    199017.36
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000041'::uuid,
    '20000000-0000-0000-0000-000000000042'::uuid,
    2026, 10,
    1990173.6,
    0.0,
    199017.36
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000041'::uuid,
    '20000000-0000-0000-0000-000000000042'::uuid,
    2026, 11,
    1990173.6,
    0.0,
    199017.36
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000041'::uuid,
    '20000000-0000-0000-0000-000000000042'::uuid,
    2026, 12,
    1990173.6,
    0.0,
    199017.36
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000024'::uuid,
    '20000000-0000-0000-0000-000000000025'::uuid,
    2026, 1,
    3150000.0,
    315000.0,
    283500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000024'::uuid,
    '20000000-0000-0000-0000-000000000025'::uuid,
    2026, 2,
    3150000.0,
    315000.0,
    283500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000024'::uuid,
    '20000000-0000-0000-0000-000000000025'::uuid,
    2026, 3,
    3150000.0,
    315000.0,
    283500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000024'::uuid,
    '20000000-0000-0000-0000-000000000025'::uuid,
    2026, 4,
    3150000.0,
    315000.0,
    283500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000024'::uuid,
    '20000000-0000-0000-0000-000000000025'::uuid,
    2026, 5,
    3150000.0,
    315000.0,
    283500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000024'::uuid,
    '20000000-0000-0000-0000-000000000025'::uuid,
    2026, 6,
    3150000.0,
    0.0,
    315000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000024'::uuid,
    '20000000-0000-0000-0000-000000000025'::uuid,
    2026, 7,
    3150000.0,
    0.0,
    315000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000024'::uuid,
    '20000000-0000-0000-0000-000000000025'::uuid,
    2026, 8,
    3150000.0,
    0.0,
    315000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000024'::uuid,
    '20000000-0000-0000-0000-000000000025'::uuid,
    2026, 9,
    3150000.0,
    0.0,
    315000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000024'::uuid,
    '20000000-0000-0000-0000-000000000025'::uuid,
    2026, 10,
    3150000.0,
    0.0,
    315000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000024'::uuid,
    '20000000-0000-0000-0000-000000000025'::uuid,
    2026, 11,
    3150000.0,
    0.0,
    315000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000024'::uuid,
    '20000000-0000-0000-0000-000000000025'::uuid,
    2026, 12,
    3310650.0,
    0.0,
    331065.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000043'::uuid,
    2026, 1,
    3850000.0,
    0.0,
    385000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000043'::uuid,
    2026, 2,
    4046350.0,
    0.0,
    404635.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000043'::uuid,
    2026, 3,
    4046350.0,
    0.0,
    404635.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000043'::uuid,
    2026, 4,
    4046350.0,
    0.0,
    404635.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000043'::uuid,
    2026, 5,
    4046350.0,
    0.0,
    404635.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000043'::uuid,
    2026, 6,
    4046350.0,
    0.0,
    404635.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000043'::uuid,
    2026, 7,
    4046350.0,
    0.0,
    404635.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000043'::uuid,
    2026, 8,
    4046350.0,
    0.0,
    404635.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000043'::uuid,
    2026, 9,
    4046350.0,
    0.0,
    404635.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000043'::uuid,
    2026, 10,
    4046350.0,
    0.0,
    404635.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000043'::uuid,
    2026, 11,
    4046350.0,
    0.0,
    404635.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000043'::uuid,
    2026, 12,
    4046350.0,
    0.0,
    404635.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000003'::uuid,
    '20000000-0000-0000-0000-000000000003'::uuid,
    2026, 1,
    1725000.0,
    0.0,
    172500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000003'::uuid,
    '20000000-0000-0000-0000-000000000003'::uuid,
    2026, 2,
    1812975.0,
    0.0,
    181297.5
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000003'::uuid,
    '20000000-0000-0000-0000-000000000003'::uuid,
    2026, 3,
    1812975.0,
    0.0,
    181297.5
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000003'::uuid,
    '20000000-0000-0000-0000-000000000003'::uuid,
    2026, 4,
    1812975.0,
    0.0,
    181297.5
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000003'::uuid,
    '20000000-0000-0000-0000-000000000003'::uuid,
    2026, 5,
    1812975.0,
    0.0,
    181297.5
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000003'::uuid,
    '20000000-0000-0000-0000-000000000003'::uuid,
    2026, 6,
    1812975.0,
    0.0,
    181297.5
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000003'::uuid,
    '20000000-0000-0000-0000-000000000003'::uuid,
    2026, 7,
    1812975.0,
    0.0,
    181297.5
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000003'::uuid,
    '20000000-0000-0000-0000-000000000003'::uuid,
    2026, 8,
    1812975.0,
    0.0,
    181297.5
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000003'::uuid,
    '20000000-0000-0000-0000-000000000003'::uuid,
    2026, 9,
    1812975.0,
    0.0,
    181297.5
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000003'::uuid,
    '20000000-0000-0000-0000-000000000003'::uuid,
    2026, 10,
    1812975.0,
    0.0,
    181297.5
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000003'::uuid,
    '20000000-0000-0000-0000-000000000003'::uuid,
    2026, 11,
    1812975.0,
    0.0,
    181297.5
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000003'::uuid,
    '20000000-0000-0000-0000-000000000003'::uuid,
    2026, 12,
    1812975.0,
    0.0,
    181297.5
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000018'::uuid,
    '20000000-0000-0000-0000-000000000019'::uuid,
    2026, 1,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000018'::uuid,
    '20000000-0000-0000-0000-000000000019'::uuid,
    2026, 2,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000018'::uuid,
    '20000000-0000-0000-0000-000000000019'::uuid,
    2026, 3,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000018'::uuid,
    '20000000-0000-0000-0000-000000000019'::uuid,
    2026, 4,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000018'::uuid,
    '20000000-0000-0000-0000-000000000019'::uuid,
    2026, 5,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000018'::uuid,
    '20000000-0000-0000-0000-000000000019'::uuid,
    2026, 6,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000018'::uuid,
    '20000000-0000-0000-0000-000000000019'::uuid,
    2026, 7,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000018'::uuid,
    '20000000-0000-0000-0000-000000000019'::uuid,
    2026, 8,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000018'::uuid,
    '20000000-0000-0000-0000-000000000019'::uuid,
    2026, 9,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000018'::uuid,
    '20000000-0000-0000-0000-000000000019'::uuid,
    2026, 10,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000018'::uuid,
    '20000000-0000-0000-0000-000000000019'::uuid,
    2026, 11,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000018'::uuid,
    '20000000-0000-0000-0000-000000000019'::uuid,
    2026, 12,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000059'::uuid,
    '20000000-0000-0000-0000-000000000064'::uuid,
    2026, 1,
    2261800.0,
    0.0,
    226180.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000059'::uuid,
    '20000000-0000-0000-0000-000000000064'::uuid,
    2026, 2,
    2261800.0,
    0.0,
    226180.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000059'::uuid,
    '20000000-0000-0000-0000-000000000064'::uuid,
    2026, 3,
    2377151.8,
    0.0,
    237715.18
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000059'::uuid,
    '20000000-0000-0000-0000-000000000064'::uuid,
    2026, 4,
    2377151.8,
    0.0,
    237715.18
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000059'::uuid,
    '20000000-0000-0000-0000-000000000064'::uuid,
    2026, 5,
    2377151.8,
    0.0,
    237715.18
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000059'::uuid,
    '20000000-0000-0000-0000-000000000064'::uuid,
    2026, 6,
    2377151.8,
    0.0,
    237715.18
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000059'::uuid,
    '20000000-0000-0000-0000-000000000064'::uuid,
    2026, 7,
    2377151.8,
    0.0,
    237715.18
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000059'::uuid,
    '20000000-0000-0000-0000-000000000064'::uuid,
    2026, 8,
    2377151.8,
    0.0,
    237715.18
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000059'::uuid,
    '20000000-0000-0000-0000-000000000064'::uuid,
    2026, 9,
    2377151.8,
    0.0,
    237715.18
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000059'::uuid,
    '20000000-0000-0000-0000-000000000064'::uuid,
    2026, 10,
    2377151.8,
    0.0,
    237715.18
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000059'::uuid,
    '20000000-0000-0000-0000-000000000064'::uuid,
    2026, 11,
    2377151.8,
    0.0,
    237715.18
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000059'::uuid,
    '20000000-0000-0000-0000-000000000064'::uuid,
    2026, 12,
    2377151.8,
    0.0,
    237715.18
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000004'::uuid,
    '20000000-0000-0000-0000-000000000004'::uuid,
    2026, 1,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000004'::uuid,
    '20000000-0000-0000-0000-000000000004'::uuid,
    2026, 2,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000004'::uuid,
    '20000000-0000-0000-0000-000000000004'::uuid,
    2026, 3,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000004'::uuid,
    '20000000-0000-0000-0000-000000000004'::uuid,
    2026, 4,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000004'::uuid,
    '20000000-0000-0000-0000-000000000004'::uuid,
    2026, 5,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000004'::uuid,
    '20000000-0000-0000-0000-000000000004'::uuid,
    2026, 6,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000004'::uuid,
    '20000000-0000-0000-0000-000000000004'::uuid,
    2026, 7,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000004'::uuid,
    '20000000-0000-0000-0000-000000000004'::uuid,
    2026, 8,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000004'::uuid,
    '20000000-0000-0000-0000-000000000004'::uuid,
    2026, 9,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000004'::uuid,
    '20000000-0000-0000-0000-000000000004'::uuid,
    2026, 10,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000004'::uuid,
    '20000000-0000-0000-0000-000000000004'::uuid,
    2026, 11,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000004'::uuid,
    '20000000-0000-0000-0000-000000000004'::uuid,
    2026, 12,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000042'::uuid,
    '20000000-0000-0000-0000-000000000044'::uuid,
    2026, 1,
    3839800.0,
    0.0,
    383980.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000042'::uuid,
    '20000000-0000-0000-0000-000000000044'::uuid,
    2026, 2,
    3839800.0,
    0.0,
    383980.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000042'::uuid,
    '20000000-0000-0000-0000-000000000044'::uuid,
    2026, 3,
    3839800.0,
    0.0,
    383980.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000042'::uuid,
    '20000000-0000-0000-0000-000000000044'::uuid,
    2026, 4,
    3839800.0,
    0.0,
    383980.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000042'::uuid,
    '20000000-0000-0000-0000-000000000044'::uuid,
    2026, 5,
    3839800.0,
    0.0,
    383980.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000042'::uuid,
    '20000000-0000-0000-0000-000000000044'::uuid,
    2026, 6,
    3839800.0,
    0.0,
    383980.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000042'::uuid,
    '20000000-0000-0000-0000-000000000044'::uuid,
    2026, 7,
    4035629.8,
    0.0,
    403562.98
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000042'::uuid,
    '20000000-0000-0000-0000-000000000044'::uuid,
    2026, 8,
    4035629.8,
    0.0,
    403562.98
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000042'::uuid,
    '20000000-0000-0000-0000-000000000044'::uuid,
    2026, 9,
    4035629.8,
    0.0,
    403562.98
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000042'::uuid,
    '20000000-0000-0000-0000-000000000044'::uuid,
    2026, 10,
    4035629.8,
    0.0,
    403562.98
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000042'::uuid,
    '20000000-0000-0000-0000-000000000044'::uuid,
    2026, 11,
    4035629.8,
    0.0,
    403562.98
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000042'::uuid,
    '20000000-0000-0000-0000-000000000044'::uuid,
    2026, 12,
    4035629.8,
    0.0,
    403562.98
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000019'::uuid,
    '20000000-0000-0000-0000-000000000020'::uuid,
    2026, 1,
    3839800.0,
    0.0,
    383980.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000019'::uuid,
    '20000000-0000-0000-0000-000000000020'::uuid,
    2026, 2,
    3839800.0,
    0.0,
    383980.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000019'::uuid,
    '20000000-0000-0000-0000-000000000020'::uuid,
    2026, 3,
    3839800.0,
    0.0,
    383980.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000019'::uuid,
    '20000000-0000-0000-0000-000000000020'::uuid,
    2026, 4,
    3839800.0,
    0.0,
    383980.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000019'::uuid,
    '20000000-0000-0000-0000-000000000020'::uuid,
    2026, 5,
    3839800.0,
    0.0,
    383980.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000019'::uuid,
    '20000000-0000-0000-0000-000000000020'::uuid,
    2026, 6,
    4035629.8,
    0.0,
    403562.98
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000019'::uuid,
    '20000000-0000-0000-0000-000000000020'::uuid,
    2026, 7,
    4035629.8,
    0.0,
    403562.98
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000019'::uuid,
    '20000000-0000-0000-0000-000000000020'::uuid,
    2026, 8,
    4035629.8,
    0.0,
    403562.98
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000019'::uuid,
    '20000000-0000-0000-0000-000000000020'::uuid,
    2026, 9,
    4035629.8,
    0.0,
    403562.98
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000019'::uuid,
    '20000000-0000-0000-0000-000000000020'::uuid,
    2026, 10,
    4035629.8,
    0.0,
    403562.98
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000019'::uuid,
    '20000000-0000-0000-0000-000000000020'::uuid,
    2026, 11,
    4035629.8,
    0.0,
    403562.98
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000019'::uuid,
    '20000000-0000-0000-0000-000000000020'::uuid,
    2026, 12,
    4035629.8,
    0.0,
    403562.98
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000060'::uuid,
    '20000000-0000-0000-0000-000000000065'::uuid,
    2026, 1,
    3650000.0,
    1095000.0,
    255500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000060'::uuid,
    '20000000-0000-0000-0000-000000000065'::uuid,
    2026, 2,
    3650000.0,
    1095000.0,
    255500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000060'::uuid,
    '20000000-0000-0000-0000-000000000065'::uuid,
    2026, 3,
    3650000.0,
    1095000.0,
    255500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000060'::uuid,
    '20000000-0000-0000-0000-000000000065'::uuid,
    2026, 4,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000060'::uuid,
    '20000000-0000-0000-0000-000000000065'::uuid,
    2026, 5,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000060'::uuid,
    '20000000-0000-0000-0000-000000000065'::uuid,
    2026, 6,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000060'::uuid,
    '20000000-0000-0000-0000-000000000065'::uuid,
    2026, 7,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000060'::uuid,
    '20000000-0000-0000-0000-000000000065'::uuid,
    2026, 8,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000060'::uuid,
    '20000000-0000-0000-0000-000000000065'::uuid,
    2026, 9,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000060'::uuid,
    '20000000-0000-0000-0000-000000000065'::uuid,
    2026, 10,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000060'::uuid,
    '20000000-0000-0000-0000-000000000065'::uuid,
    2026, 11,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000060'::uuid,
    '20000000-0000-0000-0000-000000000065'::uuid,
    2026, 12,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000005'::uuid,
    '20000000-0000-0000-0000-000000000005'::uuid,
    2026, 1,
    3650000.0,
    1095000.0,
    255500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000005'::uuid,
    '20000000-0000-0000-0000-000000000005'::uuid,
    2026, 2,
    3650000.0,
    1095000.0,
    255500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000005'::uuid,
    '20000000-0000-0000-0000-000000000005'::uuid,
    2026, 3,
    3650000.0,
    1095000.0,
    255500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000005'::uuid,
    '20000000-0000-0000-0000-000000000005'::uuid,
    2026, 4,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000005'::uuid,
    '20000000-0000-0000-0000-000000000005'::uuid,
    2026, 5,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000005'::uuid,
    '20000000-0000-0000-0000-000000000005'::uuid,
    2026, 6,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000005'::uuid,
    '20000000-0000-0000-0000-000000000005'::uuid,
    2026, 7,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000005'::uuid,
    '20000000-0000-0000-0000-000000000005'::uuid,
    2026, 8,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000005'::uuid,
    '20000000-0000-0000-0000-000000000005'::uuid,
    2026, 9,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000005'::uuid,
    '20000000-0000-0000-0000-000000000005'::uuid,
    2026, 10,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000005'::uuid,
    '20000000-0000-0000-0000-000000000005'::uuid,
    2026, 11,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000005'::uuid,
    '20000000-0000-0000-0000-000000000005'::uuid,
    2026, 12,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000043'::uuid,
    '20000000-0000-0000-0000-000000000045'::uuid,
    2026, 1,
    3050000.0,
    610000.0,
    244000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000043'::uuid,
    '20000000-0000-0000-0000-000000000045'::uuid,
    2026, 2,
    3050000.0,
    610000.0,
    244000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000043'::uuid,
    '20000000-0000-0000-0000-000000000045'::uuid,
    2026, 3,
    3050000.0,
    610000.0,
    244000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000043'::uuid,
    '20000000-0000-0000-0000-000000000045'::uuid,
    2026, 4,
    3050000.0,
    610000.0,
    244000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000043'::uuid,
    '20000000-0000-0000-0000-000000000045'::uuid,
    2026, 5,
    3050000.0,
    610000.0,
    244000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000043'::uuid,
    '20000000-0000-0000-0000-000000000045'::uuid,
    2026, 6,
    3050000.0,
    0.0,
    305000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000043'::uuid,
    '20000000-0000-0000-0000-000000000045'::uuid,
    2026, 7,
    3050000.0,
    0.0,
    305000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000043'::uuid,
    '20000000-0000-0000-0000-000000000045'::uuid,
    2026, 8,
    3050000.0,
    0.0,
    305000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000043'::uuid,
    '20000000-0000-0000-0000-000000000045'::uuid,
    2026, 9,
    3050000.0,
    0.0,
    305000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000043'::uuid,
    '20000000-0000-0000-0000-000000000045'::uuid,
    2026, 10,
    3050000.0,
    0.0,
    305000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000043'::uuid,
    '20000000-0000-0000-0000-000000000045'::uuid,
    2026, 11,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000043'::uuid,
    '20000000-0000-0000-0000-000000000045'::uuid,
    2026, 12,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000020'::uuid,
    '20000000-0000-0000-0000-000000000021'::uuid,
    2026, 1,
    3150000.0,
    315000.0,
    283500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000020'::uuid,
    '20000000-0000-0000-0000-000000000021'::uuid,
    2026, 2,
    3150000.0,
    315000.0,
    283500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000020'::uuid,
    '20000000-0000-0000-0000-000000000021'::uuid,
    2026, 3,
    3150000.0,
    315000.0,
    283500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000020'::uuid,
    '20000000-0000-0000-0000-000000000021'::uuid,
    2026, 4,
    3150000.0,
    315000.0,
    283500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000020'::uuid,
    '20000000-0000-0000-0000-000000000021'::uuid,
    2026, 5,
    3150000.0,
    315000.0,
    283500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000020'::uuid,
    '20000000-0000-0000-0000-000000000021'::uuid,
    2026, 6,
    3310650.0,
    0.0,
    331065.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000020'::uuid,
    '20000000-0000-0000-0000-000000000021'::uuid,
    2026, 7,
    3310650.0,
    0.0,
    331065.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000020'::uuid,
    '20000000-0000-0000-0000-000000000021'::uuid,
    2026, 8,
    3310650.0,
    0.0,
    331065.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000020'::uuid,
    '20000000-0000-0000-0000-000000000021'::uuid,
    2026, 9,
    3310650.0,
    0.0,
    331065.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000020'::uuid,
    '20000000-0000-0000-0000-000000000021'::uuid,
    2026, 10,
    3310650.0,
    0.0,
    331065.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000020'::uuid,
    '20000000-0000-0000-0000-000000000021'::uuid,
    2026, 11,
    3310650.0,
    0.0,
    331065.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000020'::uuid,
    '20000000-0000-0000-0000-000000000021'::uuid,
    2026, 12,
    3310650.0,
    0.0,
    331065.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000044'::uuid,
    '20000000-0000-0000-0000-000000000046'::uuid,
    2026, 1,
    3050000.0,
    305000.0,
    274500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000044'::uuid,
    '20000000-0000-0000-0000-000000000046'::uuid,
    2026, 2,
    3050000.0,
    305000.0,
    274500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000044'::uuid,
    '20000000-0000-0000-0000-000000000046'::uuid,
    2026, 3,
    3050000.0,
    305000.0,
    274500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000044'::uuid,
    '20000000-0000-0000-0000-000000000046'::uuid,
    2026, 4,
    3050000.0,
    305000.0,
    274500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000044'::uuid,
    '20000000-0000-0000-0000-000000000046'::uuid,
    2026, 5,
    3050000.0,
    305000.0,
    274500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000044'::uuid,
    '20000000-0000-0000-0000-000000000046'::uuid,
    2026, 6,
    3050000.0,
    0.0,
    305000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000044'::uuid,
    '20000000-0000-0000-0000-000000000046'::uuid,
    2026, 7,
    3050000.0,
    0.0,
    305000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000044'::uuid,
    '20000000-0000-0000-0000-000000000046'::uuid,
    2026, 8,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000044'::uuid,
    '20000000-0000-0000-0000-000000000046'::uuid,
    2026, 9,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000044'::uuid,
    '20000000-0000-0000-0000-000000000046'::uuid,
    2026, 10,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000044'::uuid,
    '20000000-0000-0000-0000-000000000046'::uuid,
    2026, 11,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000044'::uuid,
    '20000000-0000-0000-0000-000000000046'::uuid,
    2026, 12,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000071'::uuid,
    '20000000-0000-0000-0000-000000000077'::uuid,
    2026, 1,
    2250000.0,
    450000.0,
    180000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000071'::uuid,
    '20000000-0000-0000-0000-000000000077'::uuid,
    2026, 2,
    2364750.0,
    472950.0,
    189180.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000071'::uuid,
    '20000000-0000-0000-0000-000000000077'::uuid,
    2026, 3,
    2364750.0,
    472950.0,
    189180.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000071'::uuid,
    '20000000-0000-0000-0000-000000000077'::uuid,
    2026, 4,
    2364750.0,
    472950.0,
    189180.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000071'::uuid,
    '20000000-0000-0000-0000-000000000077'::uuid,
    2026, 5,
    2364750.0,
    472950.0,
    189180.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000071'::uuid,
    '20000000-0000-0000-0000-000000000077'::uuid,
    2026, 6,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000071'::uuid,
    '20000000-0000-0000-0000-000000000077'::uuid,
    2026, 7,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000071'::uuid,
    '20000000-0000-0000-0000-000000000077'::uuid,
    2026, 8,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000071'::uuid,
    '20000000-0000-0000-0000-000000000077'::uuid,
    2026, 9,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000071'::uuid,
    '20000000-0000-0000-0000-000000000077'::uuid,
    2026, 10,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000071'::uuid,
    '20000000-0000-0000-0000-000000000077'::uuid,
    2026, 11,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000071'::uuid,
    '20000000-0000-0000-0000-000000000077'::uuid,
    2026, 12,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000010'::uuid,
    '20000000-0000-0000-0000-000000000010'::uuid,
    2026, 1,
    3050000.0,
    0.0,
    305000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000010'::uuid,
    '20000000-0000-0000-0000-000000000010'::uuid,
    2026, 2,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000010'::uuid,
    '20000000-0000-0000-0000-000000000010'::uuid,
    2026, 3,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000010'::uuid,
    '20000000-0000-0000-0000-000000000010'::uuid,
    2026, 4,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000010'::uuid,
    '20000000-0000-0000-0000-000000000010'::uuid,
    2026, 5,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000010'::uuid,
    '20000000-0000-0000-0000-000000000010'::uuid,
    2026, 6,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000010'::uuid,
    '20000000-0000-0000-0000-000000000010'::uuid,
    2026, 7,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000010'::uuid,
    '20000000-0000-0000-0000-000000000010'::uuid,
    2026, 8,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000010'::uuid,
    '20000000-0000-0000-0000-000000000010'::uuid,
    2026, 9,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000010'::uuid,
    '20000000-0000-0000-0000-000000000010'::uuid,
    2026, 10,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000010'::uuid,
    '20000000-0000-0000-0000-000000000010'::uuid,
    2026, 11,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000010'::uuid,
    '20000000-0000-0000-0000-000000000010'::uuid,
    2026, 12,
    3205550.0,
    0.0,
    320555.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000061'::uuid,
    '20000000-0000-0000-0000-000000000066'::uuid,
    2026, 1,
    2150000.0,
    430000.0,
    172000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000061'::uuid,
    '20000000-0000-0000-0000-000000000066'::uuid,
    2026, 2,
    2259650.0,
    451930.0,
    180772.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000061'::uuid,
    '20000000-0000-0000-0000-000000000066'::uuid,
    2026, 3,
    2259650.0,
    451930.0,
    180772.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000061'::uuid,
    '20000000-0000-0000-0000-000000000066'::uuid,
    2026, 4,
    2259650.0,
    451930.0,
    180772.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000061'::uuid,
    '20000000-0000-0000-0000-000000000066'::uuid,
    2026, 5,
    2259650.0,
    451930.0,
    180772.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000061'::uuid,
    '20000000-0000-0000-0000-000000000066'::uuid,
    2026, 6,
    2259650.0,
    0.0,
    225965.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000061'::uuid,
    '20000000-0000-0000-0000-000000000066'::uuid,
    2026, 7,
    2259650.0,
    0.0,
    225965.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000061'::uuid,
    '20000000-0000-0000-0000-000000000066'::uuid,
    2026, 8,
    2259650.0,
    0.0,
    225965.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000061'::uuid,
    '20000000-0000-0000-0000-000000000066'::uuid,
    2026, 9,
    2259650.0,
    0.0,
    225965.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000061'::uuid,
    '20000000-0000-0000-0000-000000000066'::uuid,
    2026, 10,
    2259650.0,
    0.0,
    225965.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000061'::uuid,
    '20000000-0000-0000-0000-000000000066'::uuid,
    2026, 11,
    2259650.0,
    0.0,
    225965.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000061'::uuid,
    '20000000-0000-0000-0000-000000000066'::uuid,
    2026, 12,
    2259650.0,
    0.0,
    225965.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000011'::uuid,
    '20000000-0000-0000-0000-000000000011'::uuid,
    2026, 1,
    3313800.0,
    331380.0,
    298242.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000011'::uuid,
    '20000000-0000-0000-0000-000000000011'::uuid,
    2026, 2,
    3313800.0,
    331380.0,
    298242.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000011'::uuid,
    '20000000-0000-0000-0000-000000000011'::uuid,
    2026, 3,
    3313800.0,
    331380.0,
    298242.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000011'::uuid,
    '20000000-0000-0000-0000-000000000011'::uuid,
    2026, 4,
    3313800.0,
    331380.0,
    298242.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000011'::uuid,
    '20000000-0000-0000-0000-000000000011'::uuid,
    2026, 5,
    3313800.0,
    331380.0,
    298242.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000011'::uuid,
    '20000000-0000-0000-0000-000000000011'::uuid,
    2026, 6,
    3313800.0,
    0.0,
    331380.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000011'::uuid,
    '20000000-0000-0000-0000-000000000011'::uuid,
    2026, 7,
    3482803.8,
    0.0,
    348280.38
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000011'::uuid,
    '20000000-0000-0000-0000-000000000011'::uuid,
    2026, 8,
    3482803.8,
    0.0,
    348280.38
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000011'::uuid,
    '20000000-0000-0000-0000-000000000011'::uuid,
    2026, 9,
    3482803.8,
    0.0,
    348280.38
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000011'::uuid,
    '20000000-0000-0000-0000-000000000011'::uuid,
    2026, 10,
    3482803.8,
    0.0,
    348280.38
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000011'::uuid,
    '20000000-0000-0000-0000-000000000011'::uuid,
    2026, 11,
    3482803.8,
    0.0,
    348280.38
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000011'::uuid,
    '20000000-0000-0000-0000-000000000011'::uuid,
    2026, 12,
    3482803.8,
    0.0,
    348280.38
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000012'::uuid,
    '20000000-0000-0000-0000-000000000012'::uuid,
    2026, 1,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000012'::uuid,
    '20000000-0000-0000-0000-000000000012'::uuid,
    2026, 2,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000012'::uuid,
    '20000000-0000-0000-0000-000000000012'::uuid,
    2026, 3,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000012'::uuid,
    '20000000-0000-0000-0000-000000000012'::uuid,
    2026, 4,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000012'::uuid,
    '20000000-0000-0000-0000-000000000012'::uuid,
    2026, 5,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000012'::uuid,
    '20000000-0000-0000-0000-000000000012'::uuid,
    2026, 6,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000012'::uuid,
    '20000000-0000-0000-0000-000000000012'::uuid,
    2026, 7,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000012'::uuid,
    '20000000-0000-0000-0000-000000000012'::uuid,
    2026, 8,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000012'::uuid,
    '20000000-0000-0000-0000-000000000012'::uuid,
    2026, 9,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000012'::uuid,
    '20000000-0000-0000-0000-000000000012'::uuid,
    2026, 10,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000012'::uuid,
    '20000000-0000-0000-0000-000000000012'::uuid,
    2026, 11,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000012'::uuid,
    '20000000-0000-0000-0000-000000000012'::uuid,
    2026, 12,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000072'::uuid,
    '20000000-0000-0000-0000-000000000078'::uuid,
    2026, 1,
    2367000.0,
    0.0,
    236700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000072'::uuid,
    '20000000-0000-0000-0000-000000000078'::uuid,
    2026, 2,
    2367000.0,
    0.0,
    236700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000072'::uuid,
    '20000000-0000-0000-0000-000000000078'::uuid,
    2026, 3,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000072'::uuid,
    '20000000-0000-0000-0000-000000000078'::uuid,
    2026, 4,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000072'::uuid,
    '20000000-0000-0000-0000-000000000078'::uuid,
    2026, 5,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000072'::uuid,
    '20000000-0000-0000-0000-000000000078'::uuid,
    2026, 6,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000072'::uuid,
    '20000000-0000-0000-0000-000000000078'::uuid,
    2026, 7,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000072'::uuid,
    '20000000-0000-0000-0000-000000000078'::uuid,
    2026, 8,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000072'::uuid,
    '20000000-0000-0000-0000-000000000078'::uuid,
    2026, 9,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000072'::uuid,
    '20000000-0000-0000-0000-000000000078'::uuid,
    2026, 10,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000072'::uuid,
    '20000000-0000-0000-0000-000000000078'::uuid,
    2026, 11,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000072'::uuid,
    '20000000-0000-0000-0000-000000000078'::uuid,
    2026, 12,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000045'::uuid,
    '20000000-0000-0000-0000-000000000047'::uuid,
    2026, 1,
    2577400.0,
    0.0,
    257740.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000045'::uuid,
    '20000000-0000-0000-0000-000000000047'::uuid,
    2026, 2,
    2577400.0,
    0.0,
    257740.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000045'::uuid,
    '20000000-0000-0000-0000-000000000047'::uuid,
    2026, 3,
    2708847.4,
    0.0,
    270884.74
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000045'::uuid,
    '20000000-0000-0000-0000-000000000047'::uuid,
    2026, 4,
    2708847.4,
    0.0,
    270884.74
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000045'::uuid,
    '20000000-0000-0000-0000-000000000047'::uuid,
    2026, 5,
    2708847.4,
    0.0,
    270884.74
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000045'::uuid,
    '20000000-0000-0000-0000-000000000047'::uuid,
    2026, 6,
    2708847.4,
    0.0,
    270884.74
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000045'::uuid,
    '20000000-0000-0000-0000-000000000047'::uuid,
    2026, 7,
    2708847.4,
    0.0,
    270884.74
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000045'::uuid,
    '20000000-0000-0000-0000-000000000047'::uuid,
    2026, 8,
    2708847.4,
    0.0,
    270884.74
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000045'::uuid,
    '20000000-0000-0000-0000-000000000047'::uuid,
    2026, 9,
    2708847.4,
    0.0,
    270884.74
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000045'::uuid,
    '20000000-0000-0000-0000-000000000047'::uuid,
    2026, 10,
    2708847.4,
    0.0,
    270884.74
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000045'::uuid,
    '20000000-0000-0000-0000-000000000047'::uuid,
    2026, 11,
    2708847.4,
    0.0,
    270884.74
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000045'::uuid,
    '20000000-0000-0000-0000-000000000047'::uuid,
    2026, 12,
    2708847.4,
    0.0,
    270884.74
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000054'::uuid,
    '20000000-0000-0000-0000-000000000057'::uuid,
    2026, 1,
    2367000.0,
    0.0,
    236700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000054'::uuid,
    '20000000-0000-0000-0000-000000000057'::uuid,
    2026, 2,
    2367000.0,
    0.0,
    236700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000054'::uuid,
    '20000000-0000-0000-0000-000000000057'::uuid,
    2026, 3,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000054'::uuid,
    '20000000-0000-0000-0000-000000000057'::uuid,
    2026, 4,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000054'::uuid,
    '20000000-0000-0000-0000-000000000057'::uuid,
    2026, 5,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000054'::uuid,
    '20000000-0000-0000-0000-000000000057'::uuid,
    2026, 6,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000054'::uuid,
    '20000000-0000-0000-0000-000000000057'::uuid,
    2026, 7,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000054'::uuid,
    '20000000-0000-0000-0000-000000000057'::uuid,
    2026, 8,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000054'::uuid,
    '20000000-0000-0000-0000-000000000057'::uuid,
    2026, 9,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000054'::uuid,
    '20000000-0000-0000-0000-000000000057'::uuid,
    2026, 10,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000054'::uuid,
    '20000000-0000-0000-0000-000000000057'::uuid,
    2026, 11,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000054'::uuid,
    '20000000-0000-0000-0000-000000000057'::uuid,
    2026, 12,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000063'::uuid,
    '20000000-0000-0000-0000-000000000068'::uuid,
    2026, 1,
    2893000.0,
    0.0,
    289300.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000063'::uuid,
    '20000000-0000-0000-0000-000000000068'::uuid,
    2026, 2,
    2893000.0,
    0.0,
    289300.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000063'::uuid,
    '20000000-0000-0000-0000-000000000068'::uuid,
    2026, 3,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000063'::uuid,
    '20000000-0000-0000-0000-000000000068'::uuid,
    2026, 4,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000063'::uuid,
    '20000000-0000-0000-0000-000000000068'::uuid,
    2026, 5,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000063'::uuid,
    '20000000-0000-0000-0000-000000000068'::uuid,
    2026, 6,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000063'::uuid,
    '20000000-0000-0000-0000-000000000068'::uuid,
    2026, 7,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000063'::uuid,
    '20000000-0000-0000-0000-000000000068'::uuid,
    2026, 8,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000063'::uuid,
    '20000000-0000-0000-0000-000000000068'::uuid,
    2026, 9,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000063'::uuid,
    '20000000-0000-0000-0000-000000000068'::uuid,
    2026, 10,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000063'::uuid,
    '20000000-0000-0000-0000-000000000068'::uuid,
    2026, 11,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000063'::uuid,
    '20000000-0000-0000-0000-000000000068'::uuid,
    2026, 12,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000006'::uuid,
    '20000000-0000-0000-0000-000000000006'::uuid,
    2026, 1,
    2350000.0,
    0.0,
    235000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000006'::uuid,
    '20000000-0000-0000-0000-000000000006'::uuid,
    2026, 2,
    2350000.0,
    0.0,
    235000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000006'::uuid,
    '20000000-0000-0000-0000-000000000006'::uuid,
    2026, 3,
    2350000.0,
    0.0,
    235000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000006'::uuid,
    '20000000-0000-0000-0000-000000000006'::uuid,
    2026, 4,
    2350000.0,
    0.0,
    235000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000006'::uuid,
    '20000000-0000-0000-0000-000000000006'::uuid,
    2026, 5,
    2469850.0,
    0.0,
    246985.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000006'::uuid,
    '20000000-0000-0000-0000-000000000006'::uuid,
    2026, 6,
    2469850.0,
    0.0,
    246985.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000006'::uuid,
    '20000000-0000-0000-0000-000000000006'::uuid,
    2026, 7,
    2469850.0,
    0.0,
    246985.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000006'::uuid,
    '20000000-0000-0000-0000-000000000006'::uuid,
    2026, 8,
    2469850.0,
    0.0,
    246985.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000006'::uuid,
    '20000000-0000-0000-0000-000000000006'::uuid,
    2026, 9,
    2469850.0,
    0.0,
    246985.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000006'::uuid,
    '20000000-0000-0000-0000-000000000006'::uuid,
    2026, 10,
    2469850.0,
    0.0,
    246985.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000006'::uuid,
    '20000000-0000-0000-0000-000000000006'::uuid,
    2026, 11,
    2469850.0,
    0.0,
    246985.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000006'::uuid,
    '20000000-0000-0000-0000-000000000006'::uuid,
    2026, 12,
    2469850.0,
    0.0,
    246985.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000055'::uuid,
    '20000000-0000-0000-0000-000000000058'::uuid,
    2026, 1,
    3650000.0,
    1095000.0,
    255500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000055'::uuid,
    '20000000-0000-0000-0000-000000000058'::uuid,
    2026, 2,
    3650000.0,
    1095000.0,
    255500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000055'::uuid,
    '20000000-0000-0000-0000-000000000058'::uuid,
    2026, 3,
    3650000.0,
    1095000.0,
    255500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000055'::uuid,
    '20000000-0000-0000-0000-000000000058'::uuid,
    2026, 4,
    3650000.0,
    1095000.0,
    255500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000055'::uuid,
    '20000000-0000-0000-0000-000000000058'::uuid,
    2026, 5,
    3650000.0,
    1095000.0,
    255500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000055'::uuid,
    '20000000-0000-0000-0000-000000000058'::uuid,
    2026, 6,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000055'::uuid,
    '20000000-0000-0000-0000-000000000058'::uuid,
    2026, 7,
    3650000.0,
    0.0,
    365000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000055'::uuid,
    '20000000-0000-0000-0000-000000000058'::uuid,
    2026, 8,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000055'::uuid,
    '20000000-0000-0000-0000-000000000058'::uuid,
    2026, 9,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000055'::uuid,
    '20000000-0000-0000-0000-000000000058'::uuid,
    2026, 10,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000055'::uuid,
    '20000000-0000-0000-0000-000000000058'::uuid,
    2026, 11,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000055'::uuid,
    '20000000-0000-0000-0000-000000000058'::uuid,
    2026, 12,
    3836150.0,
    0.0,
    383615.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000064'::uuid,
    '20000000-0000-0000-0000-000000000069'::uuid,
    2026, 1,
    2950000.0,
    590000.0,
    236000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000064'::uuid,
    '20000000-0000-0000-0000-000000000069'::uuid,
    2026, 2,
    2950000.0,
    590000.0,
    236000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000064'::uuid,
    '20000000-0000-0000-0000-000000000069'::uuid,
    2026, 3,
    2950000.0,
    590000.0,
    236000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000064'::uuid,
    '20000000-0000-0000-0000-000000000069'::uuid,
    2026, 4,
    2950000.0,
    590000.0,
    236000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000064'::uuid,
    '20000000-0000-0000-0000-000000000069'::uuid,
    2026, 5,
    2950000.0,
    590000.0,
    236000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000064'::uuid,
    '20000000-0000-0000-0000-000000000069'::uuid,
    2026, 6,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000064'::uuid,
    '20000000-0000-0000-0000-000000000069'::uuid,
    2026, 7,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000064'::uuid,
    '20000000-0000-0000-0000-000000000069'::uuid,
    2026, 8,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000064'::uuid,
    '20000000-0000-0000-0000-000000000069'::uuid,
    2026, 9,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000064'::uuid,
    '20000000-0000-0000-0000-000000000069'::uuid,
    2026, 10,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000064'::uuid,
    '20000000-0000-0000-0000-000000000069'::uuid,
    2026, 11,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000064'::uuid,
    '20000000-0000-0000-0000-000000000069'::uuid,
    2026, 12,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000007'::uuid,
    '20000000-0000-0000-0000-000000000007'::uuid,
    2026, 1,
    2893000.0,
    0.0,
    289300.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000007'::uuid,
    '20000000-0000-0000-0000-000000000007'::uuid,
    2026, 2,
    2893000.0,
    0.0,
    289300.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000007'::uuid,
    '20000000-0000-0000-0000-000000000007'::uuid,
    2026, 3,
    2893000.0,
    0.0,
    289300.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000007'::uuid,
    '20000000-0000-0000-0000-000000000007'::uuid,
    2026, 4,
    2893000.0,
    0.0,
    289300.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000007'::uuid,
    '20000000-0000-0000-0000-000000000007'::uuid,
    2026, 5,
    2893000.0,
    0.0,
    289300.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000007'::uuid,
    '20000000-0000-0000-0000-000000000007'::uuid,
    2026, 6,
    2893000.0,
    0.0,
    289300.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000007'::uuid,
    '20000000-0000-0000-0000-000000000007'::uuid,
    2026, 7,
    2893000.0,
    0.0,
    289300.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000007'::uuid,
    '20000000-0000-0000-0000-000000000007'::uuid,
    2026, 8,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000007'::uuid,
    '20000000-0000-0000-0000-000000000007'::uuid,
    2026, 9,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000007'::uuid,
    '20000000-0000-0000-0000-000000000007'::uuid,
    2026, 10,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000007'::uuid,
    '20000000-0000-0000-0000-000000000007'::uuid,
    2026, 11,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000007'::uuid,
    '20000000-0000-0000-0000-000000000007'::uuid,
    2026, 12,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000026'::uuid,
    '20000000-0000-0000-0000-000000000027'::uuid,
    2026, 1,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000026'::uuid,
    '20000000-0000-0000-0000-000000000027'::uuid,
    2026, 2,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000026'::uuid,
    '20000000-0000-0000-0000-000000000027'::uuid,
    2026, 3,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000026'::uuid,
    '20000000-0000-0000-0000-000000000027'::uuid,
    2026, 4,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000026'::uuid,
    '20000000-0000-0000-0000-000000000027'::uuid,
    2026, 5,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000026'::uuid,
    '20000000-0000-0000-0000-000000000027'::uuid,
    2026, 6,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000026'::uuid,
    '20000000-0000-0000-0000-000000000027'::uuid,
    2026, 7,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000026'::uuid,
    '20000000-0000-0000-0000-000000000027'::uuid,
    2026, 8,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000026'::uuid,
    '20000000-0000-0000-0000-000000000027'::uuid,
    2026, 9,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000026'::uuid,
    '20000000-0000-0000-0000-000000000027'::uuid,
    2026, 10,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000026'::uuid,
    '20000000-0000-0000-0000-000000000027'::uuid,
    2026, 11,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000026'::uuid,
    '20000000-0000-0000-0000-000000000027'::uuid,
    2026, 12,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000047'::uuid,
    '20000000-0000-0000-0000-000000000049'::uuid,
    2026, 1,
    2950000.0,
    590000.0,
    236000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000047'::uuid,
    '20000000-0000-0000-0000-000000000049'::uuid,
    2026, 2,
    2950000.0,
    590000.0,
    236000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000047'::uuid,
    '20000000-0000-0000-0000-000000000049'::uuid,
    2026, 3,
    2950000.0,
    590000.0,
    236000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000047'::uuid,
    '20000000-0000-0000-0000-000000000049'::uuid,
    2026, 4,
    2950000.0,
    590000.0,
    236000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000047'::uuid,
    '20000000-0000-0000-0000-000000000049'::uuid,
    2026, 5,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000047'::uuid,
    '20000000-0000-0000-0000-000000000049'::uuid,
    2026, 6,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000047'::uuid,
    '20000000-0000-0000-0000-000000000049'::uuid,
    2026, 7,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000047'::uuid,
    '20000000-0000-0000-0000-000000000049'::uuid,
    2026, 8,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000047'::uuid,
    '20000000-0000-0000-0000-000000000049'::uuid,
    2026, 9,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000047'::uuid,
    '20000000-0000-0000-0000-000000000049'::uuid,
    2026, 10,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000047'::uuid,
    '20000000-0000-0000-0000-000000000049'::uuid,
    2026, 11,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000047'::uuid,
    '20000000-0000-0000-0000-000000000049'::uuid,
    2026, 12,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000065'::uuid,
    '20000000-0000-0000-0000-000000000070'::uuid,
    2026, 1,
    2367000.0,
    473400.0,
    189360.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000065'::uuid,
    '20000000-0000-0000-0000-000000000070'::uuid,
    2026, 2,
    2367000.0,
    473400.0,
    189360.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000065'::uuid,
    '20000000-0000-0000-0000-000000000070'::uuid,
    2026, 3,
    2367000.0,
    473400.0,
    189360.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000065'::uuid,
    '20000000-0000-0000-0000-000000000070'::uuid,
    2026, 4,
    2367000.0,
    473400.0,
    189360.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000065'::uuid,
    '20000000-0000-0000-0000-000000000070'::uuid,
    2026, 5,
    2367000.0,
    473400.0,
    189360.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000065'::uuid,
    '20000000-0000-0000-0000-000000000070'::uuid,
    2026, 6,
    2367000.0,
    473400.0,
    189360.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000065'::uuid,
    '20000000-0000-0000-0000-000000000070'::uuid,
    2026, 7,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000065'::uuid,
    '20000000-0000-0000-0000-000000000070'::uuid,
    2026, 8,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000065'::uuid,
    '20000000-0000-0000-0000-000000000070'::uuid,
    2026, 9,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000065'::uuid,
    '20000000-0000-0000-0000-000000000070'::uuid,
    2026, 10,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000065'::uuid,
    '20000000-0000-0000-0000-000000000070'::uuid,
    2026, 11,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000065'::uuid,
    '20000000-0000-0000-0000-000000000070'::uuid,
    2026, 12,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000073'::uuid,
    '20000000-0000-0000-0000-000000000079'::uuid,
    2026, 1,
    2157000.0,
    0.0,
    215700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000073'::uuid,
    '20000000-0000-0000-0000-000000000079'::uuid,
    2026, 2,
    2157000.0,
    0.0,
    215700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000073'::uuid,
    '20000000-0000-0000-0000-000000000079'::uuid,
    2026, 3,
    2267007.0,
    0.0,
    226700.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000073'::uuid,
    '20000000-0000-0000-0000-000000000079'::uuid,
    2026, 4,
    2267007.0,
    0.0,
    226700.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000073'::uuid,
    '20000000-0000-0000-0000-000000000079'::uuid,
    2026, 5,
    2267007.0,
    0.0,
    226700.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000073'::uuid,
    '20000000-0000-0000-0000-000000000079'::uuid,
    2026, 6,
    2267007.0,
    0.0,
    226700.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000073'::uuid,
    '20000000-0000-0000-0000-000000000079'::uuid,
    2026, 7,
    2267007.0,
    0.0,
    226700.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000073'::uuid,
    '20000000-0000-0000-0000-000000000079'::uuid,
    2026, 8,
    2267007.0,
    0.0,
    226700.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000073'::uuid,
    '20000000-0000-0000-0000-000000000079'::uuid,
    2026, 9,
    2267007.0,
    0.0,
    226700.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000073'::uuid,
    '20000000-0000-0000-0000-000000000079'::uuid,
    2026, 10,
    2267007.0,
    0.0,
    226700.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000073'::uuid,
    '20000000-0000-0000-0000-000000000079'::uuid,
    2026, 11,
    2267007.0,
    0.0,
    226700.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000073'::uuid,
    '20000000-0000-0000-0000-000000000079'::uuid,
    2026, 12,
    2267007.0,
    0.0,
    226700.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000048'::uuid,
    '20000000-0000-0000-0000-000000000050'::uuid,
    2026, 1,
    2157000.0,
    0.0,
    215700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000048'::uuid,
    '20000000-0000-0000-0000-000000000050'::uuid,
    2026, 2,
    2157000.0,
    0.0,
    215700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000048'::uuid,
    '20000000-0000-0000-0000-000000000050'::uuid,
    2026, 3,
    2157000.0,
    0.0,
    215700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000048'::uuid,
    '20000000-0000-0000-0000-000000000050'::uuid,
    2026, 4,
    2157000.0,
    0.0,
    215700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000048'::uuid,
    '20000000-0000-0000-0000-000000000050'::uuid,
    2026, 5,
    2157000.0,
    0.0,
    215700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000048'::uuid,
    '20000000-0000-0000-0000-000000000050'::uuid,
    2026, 6,
    2157000.0,
    0.0,
    215700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000048'::uuid,
    '20000000-0000-0000-0000-000000000050'::uuid,
    2026, 7,
    2157000.0,
    0.0,
    215700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000048'::uuid,
    '20000000-0000-0000-0000-000000000050'::uuid,
    2026, 8,
    2267007.0,
    0.0,
    226700.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000048'::uuid,
    '20000000-0000-0000-0000-000000000050'::uuid,
    2026, 9,
    2267007.0,
    0.0,
    226700.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000048'::uuid,
    '20000000-0000-0000-0000-000000000050'::uuid,
    2026, 10,
    2267007.0,
    0.0,
    226700.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000048'::uuid,
    '20000000-0000-0000-0000-000000000050'::uuid,
    2026, 11,
    2267007.0,
    0.0,
    226700.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000048'::uuid,
    '20000000-0000-0000-0000-000000000050'::uuid,
    2026, 12,
    2267007.0,
    0.0,
    226700.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000013'::uuid,
    '20000000-0000-0000-0000-000000000013'::uuid,
    2026, 1,
    2262000.0,
    0.0,
    226200.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000013'::uuid,
    '20000000-0000-0000-0000-000000000013'::uuid,
    2026, 2,
    2262000.0,
    0.0,
    226200.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000013'::uuid,
    '20000000-0000-0000-0000-000000000013'::uuid,
    2026, 3,
    2262000.0,
    0.0,
    226200.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000013'::uuid,
    '20000000-0000-0000-0000-000000000013'::uuid,
    2026, 4,
    2377362.0,
    0.0,
    237736.2
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000013'::uuid,
    '20000000-0000-0000-0000-000000000013'::uuid,
    2026, 5,
    2377362.0,
    0.0,
    237736.2
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000013'::uuid,
    '20000000-0000-0000-0000-000000000013'::uuid,
    2026, 6,
    2377362.0,
    0.0,
    237736.2
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000013'::uuid,
    '20000000-0000-0000-0000-000000000013'::uuid,
    2026, 7,
    2377362.0,
    0.0,
    237736.2
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000013'::uuid,
    '20000000-0000-0000-0000-000000000013'::uuid,
    2026, 8,
    2377362.0,
    0.0,
    237736.2
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000013'::uuid,
    '20000000-0000-0000-0000-000000000013'::uuid,
    2026, 9,
    2377362.0,
    0.0,
    237736.2
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000013'::uuid,
    '20000000-0000-0000-0000-000000000013'::uuid,
    2026, 10,
    2377362.0,
    0.0,
    237736.2
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000013'::uuid,
    '20000000-0000-0000-0000-000000000013'::uuid,
    2026, 11,
    2377362.0,
    0.0,
    237736.2
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000013'::uuid,
    '20000000-0000-0000-0000-000000000013'::uuid,
    2026, 12,
    2377362.0,
    0.0,
    237736.2
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000014'::uuid,
    '20000000-0000-0000-0000-000000000014'::uuid,
    2026, 1,
    2262000.0,
    226200.0,
    203580.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000014'::uuid,
    '20000000-0000-0000-0000-000000000014'::uuid,
    2026, 2,
    2262000.0,
    226200.0,
    203580.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000014'::uuid,
    '20000000-0000-0000-0000-000000000014'::uuid,
    2026, 3,
    2262000.0,
    226200.0,
    203580.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000014'::uuid,
    '20000000-0000-0000-0000-000000000014'::uuid,
    2026, 4,
    2262000.0,
    226200.0,
    203580.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000014'::uuid,
    '20000000-0000-0000-0000-000000000014'::uuid,
    2026, 5,
    2262000.0,
    226200.0,
    203580.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000014'::uuid,
    '20000000-0000-0000-0000-000000000014'::uuid,
    2026, 6,
    2377362.0,
    0.0,
    237736.2
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000014'::uuid,
    '20000000-0000-0000-0000-000000000014'::uuid,
    2026, 7,
    2377362.0,
    0.0,
    237736.2
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000014'::uuid,
    '20000000-0000-0000-0000-000000000014'::uuid,
    2026, 8,
    2377362.0,
    0.0,
    237736.2
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000014'::uuid,
    '20000000-0000-0000-0000-000000000014'::uuid,
    2026, 9,
    2377362.0,
    0.0,
    237736.2
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000014'::uuid,
    '20000000-0000-0000-0000-000000000014'::uuid,
    2026, 10,
    2377362.0,
    0.0,
    237736.2
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000014'::uuid,
    '20000000-0000-0000-0000-000000000014'::uuid,
    2026, 11,
    2377362.0,
    0.0,
    237736.2
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000014'::uuid,
    '20000000-0000-0000-0000-000000000014'::uuid,
    2026, 12,
    2377362.0,
    0.0,
    237736.2
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000027'::uuid,
    '20000000-0000-0000-0000-000000000028'::uuid,
    2026, 1,
    2250000.0,
    450000.0,
    180000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000027'::uuid,
    '20000000-0000-0000-0000-000000000028'::uuid,
    2026, 2,
    2250000.0,
    450000.0,
    180000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000027'::uuid,
    '20000000-0000-0000-0000-000000000028'::uuid,
    2026, 3,
    2250000.0,
    450000.0,
    180000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000027'::uuid,
    '20000000-0000-0000-0000-000000000028'::uuid,
    2026, 4,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000027'::uuid,
    '20000000-0000-0000-0000-000000000028'::uuid,
    2026, 5,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000027'::uuid,
    '20000000-0000-0000-0000-000000000028'::uuid,
    2026, 6,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000027'::uuid,
    '20000000-0000-0000-0000-000000000028'::uuid,
    2026, 7,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000027'::uuid,
    '20000000-0000-0000-0000-000000000028'::uuid,
    2026, 8,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000027'::uuid,
    '20000000-0000-0000-0000-000000000028'::uuid,
    2026, 9,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000027'::uuid,
    '20000000-0000-0000-0000-000000000028'::uuid,
    2026, 10,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000027'::uuid,
    '20000000-0000-0000-0000-000000000028'::uuid,
    2026, 11,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000027'::uuid,
    '20000000-0000-0000-0000-000000000028'::uuid,
    2026, 12,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000060'::uuid,
    2026, 1,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000060'::uuid,
    2026, 2,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000060'::uuid,
    2026, 3,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000060'::uuid,
    2026, 4,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000060'::uuid,
    2026, 5,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000060'::uuid,
    2026, 6,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000060'::uuid,
    2026, 7,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000060'::uuid,
    2026, 8,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000060'::uuid,
    2026, 9,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000060'::uuid,
    2026, 10,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000060'::uuid,
    2026, 11,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000060'::uuid,
    2026, 12,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000009'::uuid,
    '20000000-0000-0000-0000-000000000009'::uuid,
    2026, 1,
    2150000.0,
    430000.0,
    172000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000009'::uuid,
    '20000000-0000-0000-0000-000000000009'::uuid,
    2026, 2,
    2150000.0,
    430000.0,
    172000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000009'::uuid,
    '20000000-0000-0000-0000-000000000009'::uuid,
    2026, 3,
    2150000.0,
    430000.0,
    172000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000009'::uuid,
    '20000000-0000-0000-0000-000000000009'::uuid,
    2026, 4,
    2150000.0,
    430000.0,
    172000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000009'::uuid,
    '20000000-0000-0000-0000-000000000009'::uuid,
    2026, 5,
    2150000.0,
    430000.0,
    172000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000009'::uuid,
    '20000000-0000-0000-0000-000000000009'::uuid,
    2026, 6,
    2150000.0,
    0.0,
    215000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000009'::uuid,
    '20000000-0000-0000-0000-000000000009'::uuid,
    2026, 7,
    2150000.0,
    0.0,
    215000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000009'::uuid,
    '20000000-0000-0000-0000-000000000009'::uuid,
    2026, 8,
    2150000.0,
    0.0,
    215000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000009'::uuid,
    '20000000-0000-0000-0000-000000000009'::uuid,
    2026, 9,
    2259650.0,
    0.0,
    225965.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000009'::uuid,
    '20000000-0000-0000-0000-000000000009'::uuid,
    2026, 10,
    2259650.0,
    0.0,
    225965.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000009'::uuid,
    '20000000-0000-0000-0000-000000000009'::uuid,
    2026, 11,
    2259650.0,
    0.0,
    225965.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000009'::uuid,
    '20000000-0000-0000-0000-000000000009'::uuid,
    2026, 12,
    2259650.0,
    0.0,
    225965.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000074'::uuid,
    '20000000-0000-0000-0000-000000000080'::uuid,
    2026, 1,
    2250000.0,
    225000.0,
    202500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000074'::uuid,
    '20000000-0000-0000-0000-000000000080'::uuid,
    2026, 2,
    2250000.0,
    225000.0,
    202500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000074'::uuid,
    '20000000-0000-0000-0000-000000000080'::uuid,
    2026, 3,
    2250000.0,
    225000.0,
    202500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000074'::uuid,
    '20000000-0000-0000-0000-000000000080'::uuid,
    2026, 4,
    2250000.0,
    225000.0,
    202500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000074'::uuid,
    '20000000-0000-0000-0000-000000000080'::uuid,
    2026, 5,
    2250000.0,
    225000.0,
    202500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000074'::uuid,
    '20000000-0000-0000-0000-000000000080'::uuid,
    2026, 6,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000074'::uuid,
    '20000000-0000-0000-0000-000000000080'::uuid,
    2026, 7,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000074'::uuid,
    '20000000-0000-0000-0000-000000000080'::uuid,
    2026, 8,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000074'::uuid,
    '20000000-0000-0000-0000-000000000080'::uuid,
    2026, 9,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000074'::uuid,
    '20000000-0000-0000-0000-000000000080'::uuid,
    2026, 10,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000074'::uuid,
    '20000000-0000-0000-0000-000000000080'::uuid,
    2026, 11,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000074'::uuid,
    '20000000-0000-0000-0000-000000000080'::uuid,
    2026, 12,
    2364750.0,
    0.0,
    236475.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000075'::uuid,
    '20000000-0000-0000-0000-000000000081'::uuid,
    2026, 1,
    2350000.0,
    470000.0,
    188000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000075'::uuid,
    '20000000-0000-0000-0000-000000000081'::uuid,
    2026, 2,
    2350000.0,
    470000.0,
    188000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000075'::uuid,
    '20000000-0000-0000-0000-000000000081'::uuid,
    2026, 3,
    2350000.0,
    470000.0,
    188000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000075'::uuid,
    '20000000-0000-0000-0000-000000000081'::uuid,
    2026, 4,
    2350000.0,
    470000.0,
    188000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000075'::uuid,
    '20000000-0000-0000-0000-000000000081'::uuid,
    2026, 5,
    2350000.0,
    470000.0,
    188000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000075'::uuid,
    '20000000-0000-0000-0000-000000000081'::uuid,
    2026, 6,
    2469850.0,
    493970.0,
    197588.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000075'::uuid,
    '20000000-0000-0000-0000-000000000081'::uuid,
    2026, 7,
    2469850.0,
    0.0,
    246985.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000075'::uuid,
    '20000000-0000-0000-0000-000000000081'::uuid,
    2026, 8,
    2469850.0,
    0.0,
    246985.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000075'::uuid,
    '20000000-0000-0000-0000-000000000081'::uuid,
    2026, 9,
    2469850.0,
    0.0,
    246985.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000075'::uuid,
    '20000000-0000-0000-0000-000000000081'::uuid,
    2026, 10,
    2469850.0,
    0.0,
    246985.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000075'::uuid,
    '20000000-0000-0000-0000-000000000081'::uuid,
    2026, 11,
    2469850.0,
    0.0,
    246985.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000075'::uuid,
    '20000000-0000-0000-0000-000000000081'::uuid,
    2026, 12,
    2469850.0,
    0.0,
    246985.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000057'::uuid,
    '20000000-0000-0000-0000-000000000061'::uuid,
    2026, 1,
    1850000.0,
    555000.0,
    129500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000057'::uuid,
    '20000000-0000-0000-0000-000000000061'::uuid,
    2026, 2,
    1850000.0,
    370000.0,
    148000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000057'::uuid,
    '20000000-0000-0000-0000-000000000061'::uuid,
    2026, 3,
    1850000.0,
    370000.0,
    148000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000057'::uuid,
    '20000000-0000-0000-0000-000000000061'::uuid,
    2026, 4,
    1850000.0,
    370000.0,
    148000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000057'::uuid,
    '20000000-0000-0000-0000-000000000061'::uuid,
    2026, 5,
    1850000.0,
    370000.0,
    148000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000057'::uuid,
    '20000000-0000-0000-0000-000000000061'::uuid,
    2026, 6,
    1944350.0,
    388870.0,
    155548.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000057'::uuid,
    '20000000-0000-0000-0000-000000000061'::uuid,
    2026, 7,
    1944350.0,
    0.0,
    194435.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000057'::uuid,
    '20000000-0000-0000-0000-000000000061'::uuid,
    2026, 8,
    1944350.0,
    0.0,
    194435.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000057'::uuid,
    '20000000-0000-0000-0000-000000000061'::uuid,
    2026, 9,
    1944350.0,
    0.0,
    194435.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000057'::uuid,
    '20000000-0000-0000-0000-000000000061'::uuid,
    2026, 10,
    1944350.0,
    0.0,
    194435.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000057'::uuid,
    '20000000-0000-0000-0000-000000000061'::uuid,
    2026, 11,
    1944350.0,
    0.0,
    194435.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000057'::uuid,
    '20000000-0000-0000-0000-000000000061'::uuid,
    2026, 12,
    1944350.0,
    0.0,
    194435.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000028'::uuid,
    '20000000-0000-0000-0000-000000000029'::uuid,
    2026, 1,
    1750000.0,
    350000.0,
    140000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000028'::uuid,
    '20000000-0000-0000-0000-000000000029'::uuid,
    2026, 2,
    1750000.0,
    350000.0,
    140000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000028'::uuid,
    '20000000-0000-0000-0000-000000000029'::uuid,
    2026, 3,
    1839250.0,
    367850.0,
    147140.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000028'::uuid,
    '20000000-0000-0000-0000-000000000029'::uuid,
    2026, 4,
    1839250.0,
    367850.0,
    147140.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000028'::uuid,
    '20000000-0000-0000-0000-000000000029'::uuid,
    2026, 5,
    1839250.0,
    367850.0,
    147140.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000028'::uuid,
    '20000000-0000-0000-0000-000000000029'::uuid,
    2026, 6,
    1839250.0,
    0.0,
    183925.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000028'::uuid,
    '20000000-0000-0000-0000-000000000029'::uuid,
    2026, 7,
    1839250.0,
    0.0,
    183925.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000028'::uuid,
    '20000000-0000-0000-0000-000000000029'::uuid,
    2026, 8,
    1839250.0,
    0.0,
    183925.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000028'::uuid,
    '20000000-0000-0000-0000-000000000029'::uuid,
    2026, 9,
    1839250.0,
    0.0,
    183925.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000028'::uuid,
    '20000000-0000-0000-0000-000000000029'::uuid,
    2026, 10,
    1839250.0,
    0.0,
    183925.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000028'::uuid,
    '20000000-0000-0000-0000-000000000029'::uuid,
    2026, 11,
    1839250.0,
    0.0,
    183925.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000028'::uuid,
    '20000000-0000-0000-0000-000000000029'::uuid,
    2026, 12,
    1839250.0,
    0.0,
    183925.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000049'::uuid,
    '20000000-0000-0000-0000-000000000051'::uuid,
    2026, 1,
    2700000.0,
    270000.0,
    243000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000049'::uuid,
    '20000000-0000-0000-0000-000000000051'::uuid,
    2026, 2,
    2700000.0,
    270000.0,
    243000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000049'::uuid,
    '20000000-0000-0000-0000-000000000051'::uuid,
    2026, 3,
    2700000.0,
    270000.0,
    243000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000049'::uuid,
    '20000000-0000-0000-0000-000000000051'::uuid,
    2026, 4,
    2700000.0,
    270000.0,
    243000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000049'::uuid,
    '20000000-0000-0000-0000-000000000051'::uuid,
    2026, 5,
    2700000.0,
    270000.0,
    243000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000049'::uuid,
    '20000000-0000-0000-0000-000000000051'::uuid,
    2026, 6,
    2700000.0,
    0.0,
    270000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000049'::uuid,
    '20000000-0000-0000-0000-000000000051'::uuid,
    2026, 7,
    2837700.0,
    0.0,
    283770.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000049'::uuid,
    '20000000-0000-0000-0000-000000000051'::uuid,
    2026, 8,
    2837700.0,
    0.0,
    283770.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000049'::uuid,
    '20000000-0000-0000-0000-000000000051'::uuid,
    2026, 9,
    2837700.0,
    0.0,
    283770.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000049'::uuid,
    '20000000-0000-0000-0000-000000000051'::uuid,
    2026, 10,
    2837700.0,
    0.0,
    283770.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000049'::uuid,
    '20000000-0000-0000-0000-000000000051'::uuid,
    2026, 11,
    2837700.0,
    0.0,
    283770.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000049'::uuid,
    '20000000-0000-0000-0000-000000000051'::uuid,
    2026, 12,
    2837700.0,
    0.0,
    283770.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000029'::uuid,
    '20000000-0000-0000-0000-000000000030'::uuid,
    2026, 1,
    3629400.0,
    0.0,
    362940.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000029'::uuid,
    '20000000-0000-0000-0000-000000000030'::uuid,
    2026, 2,
    3629400.0,
    0.0,
    362940.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000029'::uuid,
    '20000000-0000-0000-0000-000000000030'::uuid,
    2026, 3,
    3629400.0,
    0.0,
    362940.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000029'::uuid,
    '20000000-0000-0000-0000-000000000030'::uuid,
    2026, 4,
    3629400.0,
    0.0,
    362940.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000029'::uuid,
    '20000000-0000-0000-0000-000000000030'::uuid,
    2026, 5,
    3629400.0,
    0.0,
    362940.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000029'::uuid,
    '20000000-0000-0000-0000-000000000030'::uuid,
    2026, 6,
    3629400.0,
    0.0,
    362940.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000029'::uuid,
    '20000000-0000-0000-0000-000000000030'::uuid,
    2026, 7,
    3629400.0,
    0.0,
    362940.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000029'::uuid,
    '20000000-0000-0000-0000-000000000030'::uuid,
    2026, 8,
    3629400.0,
    0.0,
    362940.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000029'::uuid,
    '20000000-0000-0000-0000-000000000030'::uuid,
    2026, 9,
    3629400.0,
    0.0,
    362940.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000029'::uuid,
    '20000000-0000-0000-0000-000000000030'::uuid,
    2026, 10,
    3629400.0,
    0.0,
    362940.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000029'::uuid,
    '20000000-0000-0000-0000-000000000030'::uuid,
    2026, 11,
    3629400.0,
    0.0,
    362940.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000029'::uuid,
    '20000000-0000-0000-0000-000000000030'::uuid,
    2026, 12,
    3814499.4,
    0.0,
    381449.94
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000050'::uuid,
    '20000000-0000-0000-0000-000000000052'::uuid,
    2026, 1,
    3450000.0,
    1035000.0,
    241500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000050'::uuid,
    '20000000-0000-0000-0000-000000000052'::uuid,
    2026, 2,
    3450000.0,
    1035000.0,
    241500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000050'::uuid,
    '20000000-0000-0000-0000-000000000052'::uuid,
    2026, 3,
    3450000.0,
    1035000.0,
    241500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000050'::uuid,
    '20000000-0000-0000-0000-000000000052'::uuid,
    2026, 4,
    3450000.0,
    0.0,
    345000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000050'::uuid,
    '20000000-0000-0000-0000-000000000052'::uuid,
    2026, 5,
    3450000.0,
    0.0,
    345000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000050'::uuid,
    '20000000-0000-0000-0000-000000000052'::uuid,
    2026, 6,
    3450000.0,
    0.0,
    345000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000050'::uuid,
    '20000000-0000-0000-0000-000000000052'::uuid,
    2026, 7,
    3450000.0,
    0.0,
    345000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000050'::uuid,
    '20000000-0000-0000-0000-000000000052'::uuid,
    2026, 8,
    3450000.0,
    0.0,
    345000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000050'::uuid,
    '20000000-0000-0000-0000-000000000052'::uuid,
    2026, 9,
    3625950.0,
    0.0,
    362595.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000050'::uuid,
    '20000000-0000-0000-0000-000000000052'::uuid,
    2026, 10,
    3625950.0,
    0.0,
    362595.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000050'::uuid,
    '20000000-0000-0000-0000-000000000052'::uuid,
    2026, 11,
    3625950.0,
    0.0,
    362595.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000050'::uuid,
    '20000000-0000-0000-0000-000000000052'::uuid,
    2026, 12,
    3625950.0,
    0.0,
    362595.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000015'::uuid,
    2026, 1,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000015'::uuid,
    2026, 2,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000015'::uuid,
    2026, 3,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000015'::uuid,
    2026, 4,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000015'::uuid,
    2026, 5,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000015'::uuid,
    2026, 6,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000015'::uuid,
    2026, 7,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000015'::uuid,
    2026, 8,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000015'::uuid,
    2026, 9,
    3151108.2,
    0.0,
    315110.82
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000015'::uuid,
    2026, 10,
    3151108.2,
    0.0,
    315110.82
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000015'::uuid,
    2026, 11,
    3151108.2,
    0.0,
    315110.82
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000015'::uuid,
    2026, 12,
    3151108.2,
    0.0,
    315110.82
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000030'::uuid,
    '20000000-0000-0000-0000-000000000031'::uuid,
    2026, 1,
    2998200.0,
    599640.0,
    239856.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000030'::uuid,
    '20000000-0000-0000-0000-000000000031'::uuid,
    2026, 2,
    2998200.0,
    599640.0,
    239856.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000030'::uuid,
    '20000000-0000-0000-0000-000000000031'::uuid,
    2026, 3,
    3151108.2,
    630221.64,
    252088.66
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000030'::uuid,
    '20000000-0000-0000-0000-000000000031'::uuid,
    2026, 4,
    3151108.2,
    630221.64,
    252088.66
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000030'::uuid,
    '20000000-0000-0000-0000-000000000031'::uuid,
    2026, 5,
    3151108.2,
    630221.64,
    252088.66
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000030'::uuid,
    '20000000-0000-0000-0000-000000000031'::uuid,
    2026, 6,
    3151108.2,
    0.0,
    315110.82
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000030'::uuid,
    '20000000-0000-0000-0000-000000000031'::uuid,
    2026, 7,
    3151108.2,
    0.0,
    315110.82
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000030'::uuid,
    '20000000-0000-0000-0000-000000000031'::uuid,
    2026, 8,
    3151108.2,
    0.0,
    315110.82
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000030'::uuid,
    '20000000-0000-0000-0000-000000000031'::uuid,
    2026, 9,
    3151108.2,
    0.0,
    315110.82
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000030'::uuid,
    '20000000-0000-0000-0000-000000000031'::uuid,
    2026, 10,
    3151108.2,
    0.0,
    315110.82
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000030'::uuid,
    '20000000-0000-0000-0000-000000000031'::uuid,
    2026, 11,
    3151108.2,
    0.0,
    315110.82
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000030'::uuid,
    '20000000-0000-0000-0000-000000000031'::uuid,
    2026, 12,
    3151108.2,
    0.0,
    315110.82
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000071'::uuid,
    2026, 1,
    4050000.0,
    810000.0,
    324000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000071'::uuid,
    2026, 2,
    4256550.0,
    851310.0,
    340524.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000071'::uuid,
    2026, 3,
    4256550.0,
    851310.0,
    340524.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000071'::uuid,
    2026, 4,
    4256550.0,
    851310.0,
    340524.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000071'::uuid,
    2026, 5,
    4256550.0,
    851310.0,
    340524.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000071'::uuid,
    2026, 6,
    4256550.0,
    0.0,
    425655.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000071'::uuid,
    2026, 7,
    4256550.0,
    0.0,
    425655.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000071'::uuid,
    2026, 8,
    4256550.0,
    0.0,
    425655.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000071'::uuid,
    2026, 9,
    4256550.0,
    0.0,
    425655.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000071'::uuid,
    2026, 10,
    4256550.0,
    0.0,
    425655.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000071'::uuid,
    2026, 11,
    4256550.0,
    0.0,
    425655.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000071'::uuid,
    2026, 12,
    4256550.0,
    0.0,
    425655.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000015'::uuid,
    '20000000-0000-0000-0000-000000000016'::uuid,
    2026, 1,
    2850000.0,
    570000.0,
    228000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000015'::uuid,
    '20000000-0000-0000-0000-000000000016'::uuid,
    2026, 2,
    2850000.0,
    570000.0,
    228000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000015'::uuid,
    '20000000-0000-0000-0000-000000000016'::uuid,
    2026, 3,
    2850000.0,
    570000.0,
    228000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000015'::uuid,
    '20000000-0000-0000-0000-000000000016'::uuid,
    2026, 4,
    2850000.0,
    570000.0,
    228000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000015'::uuid,
    '20000000-0000-0000-0000-000000000016'::uuid,
    2026, 5,
    2850000.0,
    570000.0,
    228000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000015'::uuid,
    '20000000-0000-0000-0000-000000000016'::uuid,
    2026, 6,
    2995350.0,
    599070.0,
    239628.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000015'::uuid,
    '20000000-0000-0000-0000-000000000016'::uuid,
    2026, 7,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000015'::uuid,
    '20000000-0000-0000-0000-000000000016'::uuid,
    2026, 8,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000015'::uuid,
    '20000000-0000-0000-0000-000000000016'::uuid,
    2026, 9,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000015'::uuid,
    '20000000-0000-0000-0000-000000000016'::uuid,
    2026, 10,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000015'::uuid,
    '20000000-0000-0000-0000-000000000016'::uuid,
    2026, 11,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000015'::uuid,
    '20000000-0000-0000-0000-000000000016'::uuid,
    2026, 12,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000067'::uuid,
    '20000000-0000-0000-0000-000000000073'::uuid,
    2026, 1,
    2650000.0,
    0.0,
    265000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000067'::uuid,
    '20000000-0000-0000-0000-000000000073'::uuid,
    2026, 2,
    2650000.0,
    0.0,
    265000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000067'::uuid,
    '20000000-0000-0000-0000-000000000073'::uuid,
    2026, 3,
    2650000.0,
    0.0,
    265000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000067'::uuid,
    '20000000-0000-0000-0000-000000000073'::uuid,
    2026, 4,
    2650000.0,
    0.0,
    265000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000067'::uuid,
    '20000000-0000-0000-0000-000000000073'::uuid,
    2026, 5,
    2785150.0,
    0.0,
    278515.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000067'::uuid,
    '20000000-0000-0000-0000-000000000073'::uuid,
    2026, 6,
    2785150.0,
    0.0,
    278515.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000067'::uuid,
    '20000000-0000-0000-0000-000000000073'::uuid,
    2026, 7,
    2785150.0,
    0.0,
    278515.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000067'::uuid,
    '20000000-0000-0000-0000-000000000073'::uuid,
    2026, 8,
    2785150.0,
    0.0,
    278515.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000067'::uuid,
    '20000000-0000-0000-0000-000000000073'::uuid,
    2026, 9,
    2785150.0,
    0.0,
    278515.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000067'::uuid,
    '20000000-0000-0000-0000-000000000073'::uuid,
    2026, 10,
    2785150.0,
    0.0,
    278515.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000067'::uuid,
    '20000000-0000-0000-0000-000000000073'::uuid,
    2026, 11,
    2785150.0,
    0.0,
    278515.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000067'::uuid,
    '20000000-0000-0000-0000-000000000073'::uuid,
    2026, 12,
    2785150.0,
    0.0,
    278515.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000069'::uuid,
    '20000000-0000-0000-0000-000000000075'::uuid,
    2026, 1,
    2750000.0,
    550000.0,
    220000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000069'::uuid,
    '20000000-0000-0000-0000-000000000075'::uuid,
    2026, 2,
    2750000.0,
    550000.0,
    220000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000069'::uuid,
    '20000000-0000-0000-0000-000000000075'::uuid,
    2026, 3,
    2750000.0,
    550000.0,
    220000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000069'::uuid,
    '20000000-0000-0000-0000-000000000075'::uuid,
    2026, 4,
    2750000.0,
    550000.0,
    220000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000069'::uuid,
    '20000000-0000-0000-0000-000000000075'::uuid,
    2026, 5,
    2750000.0,
    550000.0,
    220000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000069'::uuid,
    '20000000-0000-0000-0000-000000000075'::uuid,
    2026, 6,
    2750000.0,
    0.0,
    275000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000069'::uuid,
    '20000000-0000-0000-0000-000000000075'::uuid,
    2026, 7,
    2750000.0,
    0.0,
    275000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000069'::uuid,
    '20000000-0000-0000-0000-000000000075'::uuid,
    2026, 8,
    2750000.0,
    0.0,
    275000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000069'::uuid,
    '20000000-0000-0000-0000-000000000075'::uuid,
    2026, 9,
    2750000.0,
    0.0,
    275000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000069'::uuid,
    '20000000-0000-0000-0000-000000000075'::uuid,
    2026, 10,
    2890250.0,
    0.0,
    289025.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000069'::uuid,
    '20000000-0000-0000-0000-000000000075'::uuid,
    2026, 11,
    2890250.0,
    0.0,
    289025.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000069'::uuid,
    '20000000-0000-0000-0000-000000000075'::uuid,
    2026, 12,
    2890250.0,
    0.0,
    289025.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000032'::uuid,
    '20000000-0000-0000-0000-000000000033'::uuid,
    2026, 1,
    2950000.0,
    0.0,
    295000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000032'::uuid,
    '20000000-0000-0000-0000-000000000033'::uuid,
    2026, 2,
    2950000.0,
    0.0,
    295000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000032'::uuid,
    '20000000-0000-0000-0000-000000000033'::uuid,
    2026, 3,
    2950000.0,
    0.0,
    295000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000032'::uuid,
    '20000000-0000-0000-0000-000000000033'::uuid,
    2026, 4,
    2950000.0,
    0.0,
    295000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000032'::uuid,
    '20000000-0000-0000-0000-000000000033'::uuid,
    2026, 5,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000032'::uuid,
    '20000000-0000-0000-0000-000000000033'::uuid,
    2026, 6,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000032'::uuid,
    '20000000-0000-0000-0000-000000000033'::uuid,
    2026, 7,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000032'::uuid,
    '20000000-0000-0000-0000-000000000033'::uuid,
    2026, 8,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000032'::uuid,
    '20000000-0000-0000-0000-000000000033'::uuid,
    2026, 9,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000032'::uuid,
    '20000000-0000-0000-0000-000000000033'::uuid,
    2026, 10,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000032'::uuid,
    '20000000-0000-0000-0000-000000000033'::uuid,
    2026, 11,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000032'::uuid,
    '20000000-0000-0000-0000-000000000033'::uuid,
    2026, 12,
    3100450.0,
    0.0,
    310045.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000034'::uuid,
    '20000000-0000-0000-0000-000000000035'::uuid,
    2026, 1,
    2750000.0,
    0.0,
    275000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000034'::uuid,
    '20000000-0000-0000-0000-000000000035'::uuid,
    2026, 2,
    2750000.0,
    0.0,
    275000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000034'::uuid,
    '20000000-0000-0000-0000-000000000035'::uuid,
    2026, 3,
    2750000.0,
    0.0,
    275000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000034'::uuid,
    '20000000-0000-0000-0000-000000000035'::uuid,
    2026, 4,
    2750000.0,
    0.0,
    275000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000034'::uuid,
    '20000000-0000-0000-0000-000000000035'::uuid,
    2026, 5,
    2750000.0,
    0.0,
    275000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000034'::uuid,
    '20000000-0000-0000-0000-000000000035'::uuid,
    2026, 6,
    2750000.0,
    0.0,
    275000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000034'::uuid,
    '20000000-0000-0000-0000-000000000035'::uuid,
    2026, 7,
    2890250.0,
    0.0,
    289025.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000034'::uuid,
    '20000000-0000-0000-0000-000000000035'::uuid,
    2026, 8,
    2890250.0,
    0.0,
    289025.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000034'::uuid,
    '20000000-0000-0000-0000-000000000035'::uuid,
    2026, 9,
    2890250.0,
    0.0,
    289025.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000034'::uuid,
    '20000000-0000-0000-0000-000000000035'::uuid,
    2026, 10,
    2890250.0,
    0.0,
    289025.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000034'::uuid,
    '20000000-0000-0000-0000-000000000035'::uuid,
    2026, 11,
    2890250.0,
    0.0,
    289025.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000034'::uuid,
    '20000000-0000-0000-0000-000000000035'::uuid,
    2026, 12,
    2890250.0,
    0.0,
    289025.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000023'::uuid,
    '20000000-0000-0000-0000-000000000024'::uuid,
    2026, 1,
    3208600.0,
    1757700.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000023'::uuid,
    '20000000-0000-0000-0000-000000000024'::uuid,
    2026, 2,
    3208600.0,
    1757700.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000023'::uuid,
    '20000000-0000-0000-0000-000000000024'::uuid,
    2026, 3,
    3208600.0,
    1757700.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000023'::uuid,
    '20000000-0000-0000-0000-000000000024'::uuid,
    2026, 4,
    3208600.0,
    1757700.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000023'::uuid,
    '20000000-0000-0000-0000-000000000024'::uuid,
    2026, 5,
    3208600.0,
    1757700.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000023'::uuid,
    '20000000-0000-0000-0000-000000000024'::uuid,
    2026, 6,
    3208600.0,
    1757700.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000023'::uuid,
    '20000000-0000-0000-0000-000000000024'::uuid,
    2026, 7,
    3208600.0,
    1757700.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000023'::uuid,
    '20000000-0000-0000-0000-000000000024'::uuid,
    2026, 8,
    3208600.0,
    1757700.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000023'::uuid,
    '20000000-0000-0000-0000-000000000024'::uuid,
    2026, 9,
    3372238.6,
    1757700.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000023'::uuid,
    '20000000-0000-0000-0000-000000000024'::uuid,
    2026, 10,
    3372238.6,
    0.0,
    337223.86
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000023'::uuid,
    '20000000-0000-0000-0000-000000000024'::uuid,
    2026, 11,
    3372238.6,
    0.0,
    337223.86
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000023'::uuid,
    '20000000-0000-0000-0000-000000000024'::uuid,
    2026, 12,
    3372238.6,
    0.0,
    337223.86
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000016'::uuid,
    '20000000-0000-0000-0000-000000000017'::uuid,
    2026, 1,
    2850000.0,
    285000.0,
    256500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000016'::uuid,
    '20000000-0000-0000-0000-000000000017'::uuid,
    2026, 2,
    2850000.0,
    285000.0,
    256500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000016'::uuid,
    '20000000-0000-0000-0000-000000000017'::uuid,
    2026, 3,
    2850000.0,
    285000.0,
    256500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000016'::uuid,
    '20000000-0000-0000-0000-000000000017'::uuid,
    2026, 4,
    2995350.0,
    299535.0,
    269581.5
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000016'::uuid,
    '20000000-0000-0000-0000-000000000017'::uuid,
    2026, 5,
    2995350.0,
    299535.0,
    269581.5
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000016'::uuid,
    '20000000-0000-0000-0000-000000000017'::uuid,
    2026, 6,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000016'::uuid,
    '20000000-0000-0000-0000-000000000017'::uuid,
    2026, 7,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000016'::uuid,
    '20000000-0000-0000-0000-000000000017'::uuid,
    2026, 8,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000016'::uuid,
    '20000000-0000-0000-0000-000000000017'::uuid,
    2026, 9,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000016'::uuid,
    '20000000-0000-0000-0000-000000000017'::uuid,
    2026, 10,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000016'::uuid,
    '20000000-0000-0000-0000-000000000017'::uuid,
    2026, 11,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000016'::uuid,
    '20000000-0000-0000-0000-000000000017'::uuid,
    2026, 12,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000058'::uuid,
    '20000000-0000-0000-0000-000000000062'::uuid,
    2026, 1,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000058'::uuid,
    '20000000-0000-0000-0000-000000000062'::uuid,
    2026, 2,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000058'::uuid,
    '20000000-0000-0000-0000-000000000062'::uuid,
    2026, 3,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000058'::uuid,
    '20000000-0000-0000-0000-000000000062'::uuid,
    2026, 4,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000058'::uuid,
    '20000000-0000-0000-0000-000000000062'::uuid,
    2026, 5,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000058'::uuid,
    '20000000-0000-0000-0000-000000000062'::uuid,
    2026, 6,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000058'::uuid,
    '20000000-0000-0000-0000-000000000062'::uuid,
    2026, 7,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000058'::uuid,
    '20000000-0000-0000-0000-000000000062'::uuid,
    2026, 8,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000058'::uuid,
    '20000000-0000-0000-0000-000000000062'::uuid,
    2026, 9,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000058'::uuid,
    '20000000-0000-0000-0000-000000000062'::uuid,
    2026, 10,
    2998200.0,
    0.0,
    299820.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000058'::uuid,
    '20000000-0000-0000-0000-000000000062'::uuid,
    2026, 11,
    3151108.2,
    0.0,
    315110.82
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000058'::uuid,
    '20000000-0000-0000-0000-000000000062'::uuid,
    2026, 12,
    3151108.2,
    0.0,
    315110.82
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000051'::uuid,
    '20000000-0000-0000-0000-000000000053'::uuid,
    2026, 1,
    2850000.0,
    570000.0,
    228000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000051'::uuid,
    '20000000-0000-0000-0000-000000000053'::uuid,
    2026, 2,
    2850000.0,
    570000.0,
    228000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000051'::uuid,
    '20000000-0000-0000-0000-000000000053'::uuid,
    2026, 3,
    2850000.0,
    570000.0,
    228000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000051'::uuid,
    '20000000-0000-0000-0000-000000000053'::uuid,
    2026, 4,
    2995350.0,
    599070.0,
    239628.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000051'::uuid,
    '20000000-0000-0000-0000-000000000053'::uuid,
    2026, 5,
    2995350.0,
    599070.0,
    239628.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000051'::uuid,
    '20000000-0000-0000-0000-000000000053'::uuid,
    2026, 6,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000051'::uuid,
    '20000000-0000-0000-0000-000000000053'::uuid,
    2026, 7,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000051'::uuid,
    '20000000-0000-0000-0000-000000000053'::uuid,
    2026, 8,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000051'::uuid,
    '20000000-0000-0000-0000-000000000053'::uuid,
    2026, 9,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000051'::uuid,
    '20000000-0000-0000-0000-000000000053'::uuid,
    2026, 10,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000051'::uuid,
    '20000000-0000-0000-0000-000000000053'::uuid,
    2026, 11,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000051'::uuid,
    '20000000-0000-0000-0000-000000000053'::uuid,
    2026, 12,
    2995350.0,
    0.0,
    299535.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000070'::uuid,
    '20000000-0000-0000-0000-000000000076'::uuid,
    2026, 1,
    2893000.0,
    578600.0,
    231440.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000070'::uuid,
    '20000000-0000-0000-0000-000000000076'::uuid,
    2026, 2,
    3040543.0,
    608108.6,
    243243.44
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000070'::uuid,
    '20000000-0000-0000-0000-000000000076'::uuid,
    2026, 3,
    3040543.0,
    608108.6,
    243243.44
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000070'::uuid,
    '20000000-0000-0000-0000-000000000076'::uuid,
    2026, 4,
    3040543.0,
    608108.6,
    243243.44
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000070'::uuid,
    '20000000-0000-0000-0000-000000000076'::uuid,
    2026, 5,
    3040543.0,
    608108.6,
    243243.44
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000070'::uuid,
    '20000000-0000-0000-0000-000000000076'::uuid,
    2026, 6,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000070'::uuid,
    '20000000-0000-0000-0000-000000000076'::uuid,
    2026, 7,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000070'::uuid,
    '20000000-0000-0000-0000-000000000076'::uuid,
    2026, 8,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000070'::uuid,
    '20000000-0000-0000-0000-000000000076'::uuid,
    2026, 9,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000070'::uuid,
    '20000000-0000-0000-0000-000000000076'::uuid,
    2026, 10,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000070'::uuid,
    '20000000-0000-0000-0000-000000000076'::uuid,
    2026, 11,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000070'::uuid,
    '20000000-0000-0000-0000-000000000076'::uuid,
    2026, 12,
    3040543.0,
    0.0,
    304054.3
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000077'::uuid,
    '20000000-0000-0000-0000-000000000083'::uuid,
    2026, 1,
    1420200.0,
    426060.0,
    99414.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000077'::uuid,
    '20000000-0000-0000-0000-000000000083'::uuid,
    2026, 2,
    1492630.2,
    447789.06,
    104484.11
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000077'::uuid,
    '20000000-0000-0000-0000-000000000083'::uuid,
    2026, 3,
    1492630.2,
    0.0,
    149263.02
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000077'::uuid,
    '20000000-0000-0000-0000-000000000083'::uuid,
    2026, 4,
    1492630.2,
    0.0,
    149263.02
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000077'::uuid,
    '20000000-0000-0000-0000-000000000083'::uuid,
    2026, 5,
    1492630.2,
    0.0,
    149263.02
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000077'::uuid,
    '20000000-0000-0000-0000-000000000083'::uuid,
    2026, 6,
    1492630.2,
    0.0,
    149263.02
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000077'::uuid,
    '20000000-0000-0000-0000-000000000083'::uuid,
    2026, 7,
    1492630.2,
    0.0,
    149263.02
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000077'::uuid,
    '20000000-0000-0000-0000-000000000083'::uuid,
    2026, 8,
    1492630.2,
    0.0,
    149263.02
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000077'::uuid,
    '20000000-0000-0000-0000-000000000083'::uuid,
    2026, 9,
    1492630.2,
    0.0,
    149263.02
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000077'::uuid,
    '20000000-0000-0000-0000-000000000083'::uuid,
    2026, 10,
    1492630.2,
    0.0,
    149263.02
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000077'::uuid,
    '20000000-0000-0000-0000-000000000083'::uuid,
    2026, 11,
    1492630.2,
    0.0,
    149263.02
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000077'::uuid,
    '20000000-0000-0000-0000-000000000083'::uuid,
    2026, 12,
    1492630.2,
    0.0,
    149263.02
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000017'::uuid,
    '20000000-0000-0000-0000-000000000018'::uuid,
    2026, 1,
    2367000.0,
    236700.0,
    213030.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000017'::uuid,
    '20000000-0000-0000-0000-000000000018'::uuid,
    2026, 2,
    2367000.0,
    236700.0,
    213030.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000017'::uuid,
    '20000000-0000-0000-0000-000000000018'::uuid,
    2026, 3,
    2367000.0,
    236700.0,
    213030.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000017'::uuid,
    '20000000-0000-0000-0000-000000000018'::uuid,
    2026, 4,
    2367000.0,
    236700.0,
    213030.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000017'::uuid,
    '20000000-0000-0000-0000-000000000018'::uuid,
    2026, 5,
    2367000.0,
    236700.0,
    213030.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000017'::uuid,
    '20000000-0000-0000-0000-000000000018'::uuid,
    2026, 6,
    2367000.0,
    0.0,
    236700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000017'::uuid,
    '20000000-0000-0000-0000-000000000018'::uuid,
    2026, 7,
    2367000.0,
    0.0,
    236700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000017'::uuid,
    '20000000-0000-0000-0000-000000000018'::uuid,
    2026, 8,
    2367000.0,
    0.0,
    236700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000017'::uuid,
    '20000000-0000-0000-0000-000000000018'::uuid,
    2026, 9,
    2367000.0,
    0.0,
    236700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000017'::uuid,
    '20000000-0000-0000-0000-000000000018'::uuid,
    2026, 10,
    2367000.0,
    0.0,
    236700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000017'::uuid,
    '20000000-0000-0000-0000-000000000018'::uuid,
    2026, 11,
    2367000.0,
    0.0,
    236700.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000017'::uuid,
    '20000000-0000-0000-0000-000000000018'::uuid,
    2026, 12,
    2487717.0,
    0.0,
    248771.7
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000035'::uuid,
    '20000000-0000-0000-0000-000000000036'::uuid,
    2026, 1,
    1450000.0,
    290000.0,
    116000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000035'::uuid,
    '20000000-0000-0000-0000-000000000036'::uuid,
    2026, 2,
    1450000.0,
    290000.0,
    116000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000035'::uuid,
    '20000000-0000-0000-0000-000000000036'::uuid,
    2026, 3,
    1450000.0,
    290000.0,
    116000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000035'::uuid,
    '20000000-0000-0000-0000-000000000036'::uuid,
    2026, 4,
    1450000.0,
    290000.0,
    116000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000035'::uuid,
    '20000000-0000-0000-0000-000000000036'::uuid,
    2026, 5,
    1450000.0,
    290000.0,
    116000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000035'::uuid,
    '20000000-0000-0000-0000-000000000036'::uuid,
    2026, 6,
    1450000.0,
    0.0,
    145000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000035'::uuid,
    '20000000-0000-0000-0000-000000000036'::uuid,
    2026, 7,
    1523950.0,
    0.0,
    152395.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000035'::uuid,
    '20000000-0000-0000-0000-000000000036'::uuid,
    2026, 8,
    1523950.0,
    0.0,
    152395.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000035'::uuid,
    '20000000-0000-0000-0000-000000000036'::uuid,
    2026, 9,
    1523950.0,
    0.0,
    152395.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000035'::uuid,
    '20000000-0000-0000-0000-000000000036'::uuid,
    2026, 10,
    1523950.0,
    0.0,
    152395.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000035'::uuid,
    '20000000-0000-0000-0000-000000000036'::uuid,
    2026, 11,
    1523950.0,
    0.0,
    152395.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000035'::uuid,
    '20000000-0000-0000-0000-000000000036'::uuid,
    2026, 12,
    1523950.0,
    0.0,
    152395.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000063'::uuid,
    2026, 1,
    1650000.0,
    0.0,
    165000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000063'::uuid,
    2026, 2,
    1650000.0,
    0.0,
    165000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000063'::uuid,
    2026, 3,
    1650000.0,
    0.0,
    165000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000063'::uuid,
    2026, 4,
    1650000.0,
    0.0,
    165000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000063'::uuid,
    2026, 5,
    1650000.0,
    0.0,
    165000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000063'::uuid,
    2026, 6,
    1650000.0,
    0.0,
    165000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000063'::uuid,
    2026, 7,
    1650000.0,
    0.0,
    165000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000063'::uuid,
    2026, 8,
    1650000.0,
    0.0,
    165000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000063'::uuid,
    2026, 9,
    1734150.0,
    0.0,
    173415.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000063'::uuid,
    2026, 10,
    1734150.0,
    0.0,
    173415.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000063'::uuid,
    2026, 11,
    1734150.0,
    0.0,
    173415.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000063'::uuid,
    2026, 12,
    1734150.0,
    0.0,
    173415.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000036'::uuid,
    '20000000-0000-0000-0000-000000000037'::uuid,
    2026, 1,
    1472800.0,
    441840.0,
    103096.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000036'::uuid,
    '20000000-0000-0000-0000-000000000037'::uuid,
    2026, 2,
    1472800.0,
    441840.0,
    103096.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000036'::uuid,
    '20000000-0000-0000-0000-000000000037'::uuid,
    2026, 3,
    1472800.0,
    441840.0,
    103096.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000036'::uuid,
    '20000000-0000-0000-0000-000000000037'::uuid,
    2026, 4,
    1472800.0,
    441840.0,
    103096.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000036'::uuid,
    '20000000-0000-0000-0000-000000000037'::uuid,
    2026, 5,
    1472800.0,
    441840.0,
    103096.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000036'::uuid,
    '20000000-0000-0000-0000-000000000037'::uuid,
    2026, 6,
    1472800.0,
    441840.0,
    103096.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000036'::uuid,
    '20000000-0000-0000-0000-000000000037'::uuid,
    2026, 7,
    1472800.0,
    0.0,
    147280.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000036'::uuid,
    '20000000-0000-0000-0000-000000000037'::uuid,
    2026, 8,
    1472800.0,
    0.0,
    147280.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000036'::uuid,
    '20000000-0000-0000-0000-000000000037'::uuid,
    2026, 9,
    1472800.0,
    0.0,
    147280.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000036'::uuid,
    '20000000-0000-0000-0000-000000000037'::uuid,
    2026, 10,
    1472800.0,
    0.0,
    147280.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000036'::uuid,
    '20000000-0000-0000-0000-000000000037'::uuid,
    2026, 11,
    1472800.0,
    0.0,
    147280.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000036'::uuid,
    '20000000-0000-0000-0000-000000000037'::uuid,
    2026, 12,
    1547912.8,
    0.0,
    154791.28
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000078'::uuid,
    '20000000-0000-0000-0000-000000000084'::uuid,
    2026, 1,
    2550000.0,
    0.0,
    255000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000078'::uuid,
    '20000000-0000-0000-0000-000000000084'::uuid,
    2026, 2,
    2550000.0,
    0.0,
    255000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000078'::uuid,
    '20000000-0000-0000-0000-000000000084'::uuid,
    2026, 3,
    2550000.0,
    0.0,
    255000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000078'::uuid,
    '20000000-0000-0000-0000-000000000084'::uuid,
    2026, 4,
    2550000.0,
    0.0,
    255000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000078'::uuid,
    '20000000-0000-0000-0000-000000000084'::uuid,
    2026, 5,
    2550000.0,
    0.0,
    255000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000078'::uuid,
    '20000000-0000-0000-0000-000000000084'::uuid,
    2026, 6,
    2550000.0,
    0.0,
    255000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000078'::uuid,
    '20000000-0000-0000-0000-000000000084'::uuid,
    2026, 7,
    2550000.0,
    0.0,
    255000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000078'::uuid,
    '20000000-0000-0000-0000-000000000084'::uuid,
    2026, 8,
    2550000.0,
    0.0,
    255000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000078'::uuid,
    '20000000-0000-0000-0000-000000000084'::uuid,
    2026, 9,
    2680050.0,
    0.0,
    268005.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000078'::uuid,
    '20000000-0000-0000-0000-000000000084'::uuid,
    2026, 10,
    2680050.0,
    0.0,
    268005.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000078'::uuid,
    '20000000-0000-0000-0000-000000000084'::uuid,
    2026, 11,
    2680050.0,
    0.0,
    268005.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000078'::uuid,
    '20000000-0000-0000-0000-000000000084'::uuid,
    2026, 12,
    2680050.0,
    0.0,
    268005.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000025'::uuid,
    '20000000-0000-0000-0000-000000000026'::uuid,
    2026, 1,
    5850000.0,
    1170000.0,
    468000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000025'::uuid,
    '20000000-0000-0000-0000-000000000026'::uuid,
    2026, 2,
    5850000.0,
    1170000.0,
    468000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000025'::uuid,
    '20000000-0000-0000-0000-000000000026'::uuid,
    2026, 3,
    5850000.0,
    1170000.0,
    468000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000025'::uuid,
    '20000000-0000-0000-0000-000000000026'::uuid,
    2026, 4,
    5850000.0,
    1170000.0,
    468000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000025'::uuid,
    '20000000-0000-0000-0000-000000000026'::uuid,
    2026, 5,
    5850000.0,
    1170000.0,
    468000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000025'::uuid,
    '20000000-0000-0000-0000-000000000026'::uuid,
    2026, 6,
    5850000.0,
    0.0,
    585000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000025'::uuid,
    '20000000-0000-0000-0000-000000000026'::uuid,
    2026, 7,
    5850000.0,
    0.0,
    585000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000025'::uuid,
    '20000000-0000-0000-0000-000000000026'::uuid,
    2026, 8,
    5850000.0,
    0.0,
    585000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000025'::uuid,
    '20000000-0000-0000-0000-000000000026'::uuid,
    2026, 9,
    5850000.0,
    0.0,
    585000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000025'::uuid,
    '20000000-0000-0000-0000-000000000026'::uuid,
    2026, 10,
    5850000.0,
    0.0,
    585000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000025'::uuid,
    '20000000-0000-0000-0000-000000000026'::uuid,
    2026, 11,
    6148350.0,
    0.0,
    614835.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000025'::uuid,
    '20000000-0000-0000-0000-000000000026'::uuid,
    2026, 12,
    6148350.0,
    0.0,
    614835.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000062'::uuid,
    '20000000-0000-0000-0000-000000000067'::uuid,
    2026, 1,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000062'::uuid,
    '20000000-0000-0000-0000-000000000067'::uuid,
    2026, 2,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000062'::uuid,
    '20000000-0000-0000-0000-000000000067'::uuid,
    2026, 3,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000062'::uuid,
    '20000000-0000-0000-0000-000000000067'::uuid,
    2026, 4,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000062'::uuid,
    '20000000-0000-0000-0000-000000000067'::uuid,
    2026, 5,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000062'::uuid,
    '20000000-0000-0000-0000-000000000067'::uuid,
    2026, 6,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000062'::uuid,
    '20000000-0000-0000-0000-000000000067'::uuid,
    2026, 7,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000062'::uuid,
    '20000000-0000-0000-0000-000000000067'::uuid,
    2026, 8,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000062'::uuid,
    '20000000-0000-0000-0000-000000000067'::uuid,
    2026, 9,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000062'::uuid,
    '20000000-0000-0000-0000-000000000067'::uuid,
    2026, 10,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000062'::uuid,
    '20000000-0000-0000-0000-000000000067'::uuid,
    2026, 11,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000062'::uuid,
    '20000000-0000-0000-0000-000000000067'::uuid,
    2026, 12,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000046'::uuid,
    '20000000-0000-0000-0000-000000000048'::uuid,
    2026, 1,
    5217920.0,
    0.0,
    521792.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000046'::uuid,
    '20000000-0000-0000-0000-000000000048'::uuid,
    2026, 2,
    5217920.0,
    0.0,
    521792.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000046'::uuid,
    '20000000-0000-0000-0000-000000000048'::uuid,
    2026, 3,
    5217920.0,
    0.0,
    521792.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000046'::uuid,
    '20000000-0000-0000-0000-000000000048'::uuid,
    2026, 4,
    5217920.0,
    0.0,
    521792.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000046'::uuid,
    '20000000-0000-0000-0000-000000000048'::uuid,
    2026, 5,
    5217920.0,
    0.0,
    521792.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000046'::uuid,
    '20000000-0000-0000-0000-000000000048'::uuid,
    2026, 6,
    5217920.0,
    0.0,
    521792.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000046'::uuid,
    '20000000-0000-0000-0000-000000000048'::uuid,
    2026, 7,
    5217920.0,
    0.0,
    521792.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000046'::uuid,
    '20000000-0000-0000-0000-000000000048'::uuid,
    2026, 8,
    5484033.92,
    0.0,
    548403.39
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000046'::uuid,
    '20000000-0000-0000-0000-000000000048'::uuid,
    2026, 9,
    5484033.92,
    0.0,
    548403.39
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000046'::uuid,
    '20000000-0000-0000-0000-000000000048'::uuid,
    2026, 10,
    5484033.92,
    0.0,
    548403.39
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000046'::uuid,
    '20000000-0000-0000-0000-000000000048'::uuid,
    2026, 11,
    5484033.92,
    0.0,
    548403.39
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000046'::uuid,
    '20000000-0000-0000-0000-000000000048'::uuid,
    2026, 12,
    5484033.92,
    0.0,
    548403.39
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000021'::uuid,
    '20000000-0000-0000-0000-000000000022'::uuid,
    2026, 1,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000021'::uuid,
    '20000000-0000-0000-0000-000000000022'::uuid,
    2026, 2,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000021'::uuid,
    '20000000-0000-0000-0000-000000000022'::uuid,
    2026, 3,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000021'::uuid,
    '20000000-0000-0000-0000-000000000022'::uuid,
    2026, 4,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000021'::uuid,
    '20000000-0000-0000-0000-000000000022'::uuid,
    2026, 5,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000021'::uuid,
    '20000000-0000-0000-0000-000000000022'::uuid,
    2026, 6,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000021'::uuid,
    '20000000-0000-0000-0000-000000000022'::uuid,
    2026, 7,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000021'::uuid,
    '20000000-0000-0000-0000-000000000022'::uuid,
    2026, 8,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000021'::uuid,
    '20000000-0000-0000-0000-000000000022'::uuid,
    2026, 9,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000021'::uuid,
    '20000000-0000-0000-0000-000000000022'::uuid,
    2026, 10,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000021'::uuid,
    '20000000-0000-0000-0000-000000000022'::uuid,
    2026, 11,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000021'::uuid,
    '20000000-0000-0000-0000-000000000022'::uuid,
    2026, 12,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000008'::uuid,
    '20000000-0000-0000-0000-000000000008'::uuid,
    2026, 1,
    4300000.0,
    860000.0,
    344000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000008'::uuid,
    '20000000-0000-0000-0000-000000000008'::uuid,
    2026, 2,
    4300000.0,
    860000.0,
    344000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000008'::uuid,
    '20000000-0000-0000-0000-000000000008'::uuid,
    2026, 3,
    4519300.0,
    903860.0,
    361544.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000008'::uuid,
    '20000000-0000-0000-0000-000000000008'::uuid,
    2026, 4,
    4519300.0,
    903860.0,
    361544.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000008'::uuid,
    '20000000-0000-0000-0000-000000000008'::uuid,
    2026, 5,
    4519300.0,
    903860.0,
    361544.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000008'::uuid,
    '20000000-0000-0000-0000-000000000008'::uuid,
    2026, 6,
    4519300.0,
    0.0,
    451930.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000008'::uuid,
    '20000000-0000-0000-0000-000000000008'::uuid,
    2026, 7,
    4519300.0,
    0.0,
    451930.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000008'::uuid,
    '20000000-0000-0000-0000-000000000008'::uuid,
    2026, 8,
    4519300.0,
    0.0,
    451930.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000008'::uuid,
    '20000000-0000-0000-0000-000000000008'::uuid,
    2026, 9,
    4519300.0,
    0.0,
    451930.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000008'::uuid,
    '20000000-0000-0000-0000-000000000008'::uuid,
    2026, 10,
    4519300.0,
    0.0,
    451930.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000008'::uuid,
    '20000000-0000-0000-0000-000000000008'::uuid,
    2026, 11,
    4519300.0,
    0.0,
    451930.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000008'::uuid,
    '20000000-0000-0000-0000-000000000008'::uuid,
    2026, 12,
    4519300.0,
    0.0,
    451930.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000056'::uuid,
    '20000000-0000-0000-0000-000000000059'::uuid,
    2026, 1,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000056'::uuid,
    '20000000-0000-0000-0000-000000000059'::uuid,
    2026, 2,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000056'::uuid,
    '20000000-0000-0000-0000-000000000059'::uuid,
    2026, 3,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000056'::uuid,
    '20000000-0000-0000-0000-000000000059'::uuid,
    2026, 4,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000056'::uuid,
    '20000000-0000-0000-0000-000000000059'::uuid,
    2026, 5,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000056'::uuid,
    '20000000-0000-0000-0000-000000000059'::uuid,
    2026, 6,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000056'::uuid,
    '20000000-0000-0000-0000-000000000059'::uuid,
    2026, 7,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000056'::uuid,
    '20000000-0000-0000-0000-000000000059'::uuid,
    2026, 8,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000056'::uuid,
    '20000000-0000-0000-0000-000000000059'::uuid,
    2026, 9,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000056'::uuid,
    '20000000-0000-0000-0000-000000000059'::uuid,
    2026, 10,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000056'::uuid,
    '20000000-0000-0000-0000-000000000059'::uuid,
    2026, 11,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000056'::uuid,
    '20000000-0000-0000-0000-000000000059'::uuid,
    2026, 12,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000022'::uuid,
    '20000000-0000-0000-0000-000000000023'::uuid,
    2026, 1,
    2050000.0,
    0.0,
    205000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000022'::uuid,
    '20000000-0000-0000-0000-000000000023'::uuid,
    2026, 2,
    2050000.0,
    0.0,
    205000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000022'::uuid,
    '20000000-0000-0000-0000-000000000023'::uuid,
    2026, 3,
    2050000.0,
    0.0,
    205000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000022'::uuid,
    '20000000-0000-0000-0000-000000000023'::uuid,
    2026, 4,
    2050000.0,
    0.0,
    205000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000022'::uuid,
    '20000000-0000-0000-0000-000000000023'::uuid,
    2026, 5,
    2050000.0,
    0.0,
    205000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000022'::uuid,
    '20000000-0000-0000-0000-000000000023'::uuid,
    2026, 6,
    2050000.0,
    0.0,
    205000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000022'::uuid,
    '20000000-0000-0000-0000-000000000023'::uuid,
    2026, 7,
    2050000.0,
    0.0,
    205000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000022'::uuid,
    '20000000-0000-0000-0000-000000000023'::uuid,
    2026, 8,
    2050000.0,
    0.0,
    205000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000022'::uuid,
    '20000000-0000-0000-0000-000000000023'::uuid,
    2026, 9,
    2154550.0,
    0.0,
    215455.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000022'::uuid,
    '20000000-0000-0000-0000-000000000023'::uuid,
    2026, 10,
    2154550.0,
    0.0,
    215455.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000022'::uuid,
    '20000000-0000-0000-0000-000000000023'::uuid,
    2026, 11,
    2154550.0,
    0.0,
    215455.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000022'::uuid,
    '20000000-0000-0000-0000-000000000023'::uuid,
    2026, 12,
    2154550.0,
    0.0,
    215455.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000066'::uuid,
    '20000000-0000-0000-0000-000000000072'::uuid,
    2026, 1,
    2050000.0,
    615000.0,
    143500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000066'::uuid,
    '20000000-0000-0000-0000-000000000072'::uuid,
    2026, 2,
    2050000.0,
    615000.0,
    143500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000066'::uuid,
    '20000000-0000-0000-0000-000000000072'::uuid,
    2026, 3,
    2050000.0,
    615000.0,
    143500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000066'::uuid,
    '20000000-0000-0000-0000-000000000072'::uuid,
    2026, 4,
    2050000.0,
    615000.0,
    143500.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000066'::uuid,
    '20000000-0000-0000-0000-000000000072'::uuid,
    2026, 5,
    2050000.0,
    0.0,
    205000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000066'::uuid,
    '20000000-0000-0000-0000-000000000072'::uuid,
    2026, 6,
    2050000.0,
    0.0,
    205000.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000066'::uuid,
    '20000000-0000-0000-0000-000000000072'::uuid,
    2026, 7,
    2154550.0,
    0.0,
    215455.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000066'::uuid,
    '20000000-0000-0000-0000-000000000072'::uuid,
    2026, 8,
    2154550.0,
    0.0,
    215455.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000066'::uuid,
    '20000000-0000-0000-0000-000000000072'::uuid,
    2026, 9,
    2154550.0,
    0.0,
    215455.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000066'::uuid,
    '20000000-0000-0000-0000-000000000072'::uuid,
    2026, 10,
    2154550.0,
    0.0,
    215455.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000066'::uuid,
    '20000000-0000-0000-0000-000000000072'::uuid,
    2026, 11,
    2154550.0,
    0.0,
    215455.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000066'::uuid,
    '20000000-0000-0000-0000-000000000072'::uuid,
    2026, 12,
    2154550.0,
    0.0,
    215455.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000031'::uuid,
    '20000000-0000-0000-0000-000000000032'::uuid,
    2026, 1,
    11309000.0,
    0.0,
    1130900.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000031'::uuid,
    '20000000-0000-0000-0000-000000000032'::uuid,
    2026, 2,
    11309000.0,
    0.0,
    1130900.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000031'::uuid,
    '20000000-0000-0000-0000-000000000032'::uuid,
    2026, 3,
    11309000.0,
    0.0,
    1130900.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000031'::uuid,
    '20000000-0000-0000-0000-000000000032'::uuid,
    2026, 4,
    11309000.0,
    0.0,
    1130900.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000031'::uuid,
    '20000000-0000-0000-0000-000000000032'::uuid,
    2026, 5,
    11309000.0,
    0.0,
    1130900.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000031'::uuid,
    '20000000-0000-0000-0000-000000000032'::uuid,
    2026, 6,
    11309000.0,
    0.0,
    1130900.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000031'::uuid,
    '20000000-0000-0000-0000-000000000032'::uuid,
    2026, 7,
    11309000.0,
    0.0,
    1130900.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000031'::uuid,
    '20000000-0000-0000-0000-000000000032'::uuid,
    2026, 8,
    11885759.0,
    0.0,
    1188575.9
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000031'::uuid,
    '20000000-0000-0000-0000-000000000032'::uuid,
    2026, 9,
    11885759.0,
    0.0,
    1188575.9
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000031'::uuid,
    '20000000-0000-0000-0000-000000000032'::uuid,
    2026, 10,
    11885759.0,
    0.0,
    1188575.9
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000031'::uuid,
    '20000000-0000-0000-0000-000000000032'::uuid,
    2026, 11,
    11885759.0,
    0.0,
    1188575.9
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000031'::uuid,
    '20000000-0000-0000-0000-000000000032'::uuid,
    2026, 12,
    11885759.0,
    0.0,
    1188575.9
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000068'::uuid,
    '20000000-0000-0000-0000-000000000074'::uuid,
    2026, 1,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000068'::uuid,
    '20000000-0000-0000-0000-000000000074'::uuid,
    2026, 2,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000068'::uuid,
    '20000000-0000-0000-0000-000000000074'::uuid,
    2026, 3,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000068'::uuid,
    '20000000-0000-0000-0000-000000000074'::uuid,
    2026, 4,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000068'::uuid,
    '20000000-0000-0000-0000-000000000074'::uuid,
    2026, 5,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000068'::uuid,
    '20000000-0000-0000-0000-000000000074'::uuid,
    2026, 6,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000068'::uuid,
    '20000000-0000-0000-0000-000000000074'::uuid,
    2026, 7,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000068'::uuid,
    '20000000-0000-0000-0000-000000000074'::uuid,
    2026, 8,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000068'::uuid,
    '20000000-0000-0000-0000-000000000074'::uuid,
    2026, 9,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000068'::uuid,
    '20000000-0000-0000-0000-000000000074'::uuid,
    2026, 10,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000068'::uuid,
    '20000000-0000-0000-0000-000000000074'::uuid,
    2026, 11,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000068'::uuid,
    '20000000-0000-0000-0000-000000000074'::uuid,
    2026, 12,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000076'::uuid,
    '20000000-0000-0000-0000-000000000082'::uuid,
    2026, 1,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000076'::uuid,
    '20000000-0000-0000-0000-000000000082'::uuid,
    2026, 2,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000076'::uuid,
    '20000000-0000-0000-0000-000000000082'::uuid,
    2026, 3,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000076'::uuid,
    '20000000-0000-0000-0000-000000000082'::uuid,
    2026, 4,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000076'::uuid,
    '20000000-0000-0000-0000-000000000082'::uuid,
    2026, 5,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000076'::uuid,
    '20000000-0000-0000-0000-000000000082'::uuid,
    2026, 6,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000076'::uuid,
    '20000000-0000-0000-0000-000000000082'::uuid,
    2026, 7,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000076'::uuid,
    '20000000-0000-0000-0000-000000000082'::uuid,
    2026, 8,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000076'::uuid,
    '20000000-0000-0000-0000-000000000082'::uuid,
    2026, 9,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000076'::uuid,
    '20000000-0000-0000-0000-000000000082'::uuid,
    2026, 10,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000076'::uuid,
    '20000000-0000-0000-0000-000000000082'::uuid,
    2026, 11,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000076'::uuid,
    '20000000-0000-0000-0000-000000000082'::uuid,
    2026, 12,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000033'::uuid,
    '20000000-0000-0000-0000-000000000034'::uuid,
    2026, 1,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000033'::uuid,
    '20000000-0000-0000-0000-000000000034'::uuid,
    2026, 2,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000033'::uuid,
    '20000000-0000-0000-0000-000000000034'::uuid,
    2026, 3,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000033'::uuid,
    '20000000-0000-0000-0000-000000000034'::uuid,
    2026, 4,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000033'::uuid,
    '20000000-0000-0000-0000-000000000034'::uuid,
    2026, 5,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000033'::uuid,
    '20000000-0000-0000-0000-000000000034'::uuid,
    2026, 6,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000033'::uuid,
    '20000000-0000-0000-0000-000000000034'::uuid,
    2026, 7,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000033'::uuid,
    '20000000-0000-0000-0000-000000000034'::uuid,
    2026, 8,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000033'::uuid,
    '20000000-0000-0000-0000-000000000034'::uuid,
    2026, 9,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000033'::uuid,
    '20000000-0000-0000-0000-000000000034'::uuid,
    2026, 10,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000033'::uuid,
    '20000000-0000-0000-0000-000000000034'::uuid,
    2026, 11,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '30000000-0000-0000-0000-000000000033'::uuid,
    '20000000-0000-0000-0000-000000000034'::uuid,
    2026, 12,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000054'::uuid,
    2026, 1,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000054'::uuid,
    2026, 2,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000054'::uuid,
    2026, 3,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000054'::uuid,
    2026, 4,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000054'::uuid,
    2026, 5,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000054'::uuid,
    2026, 6,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000054'::uuid,
    2026, 7,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000054'::uuid,
    2026, 8,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000054'::uuid,
    2026, 9,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000054'::uuid,
    2026, 10,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000054'::uuid,
    2026, 11,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;

INSERT INTO projections (company_id, contract_id, unit_id, year, month, canon_proyectado, descuento_proyectado, pronto_pago_proyectado)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    '20000000-0000-0000-0000-000000000054'::uuid,
    2026, 12,
    0.0,
    0.0,
    0.0
) ON CONFLICT (unit_id, year, month) DO UPDATE SET
    canon_proyectado = EXCLUDED.canon_proyectado,
    descuento_proyectado = EXCLUDED.descuento_proyectado,
    pronto_pago_proyectado = EXCLUDED.pronto_pago_proyectado;


-- =============================================================================
-- 6. CARTERA — Receivables snapshot from Siesa (ckrea.xlsx Cartera)
-- 277 records
-- =============================================================================

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000055'::uuid,
    '2208135',
    'RK-94',
    'KIADOM AGENCIA CREATIVA SAS 520',
    'ABONO SEPARACION LOCAL 520  ',
    '2023-06-29',
    '2023-06-13',
    '2023-06-13',
    31,
    1021,
    -2700000.0,
    -2700000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000019'::uuid,
    '2248075',
    'RK-172',
    'FUSION GRAFIK SAS 117',
    'DEPOSITO',
    '2023-08-25',
    '2023-08-22',
    '2023-08-22',
    31,
    964,
    -1000000.0,
    -1000000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000037'::uuid,
    '2366551',
    'RK-334',
    'BECERRA MATEUS AGUSTINA 120',
    'SEPARACION=1.675.000 DEPOSITO=3.800.000  ',
    '2023-12-30',
    '2023-12-20',
    '2023-12-20',
    31,
    837,
    -3021400.0,
    -3021400.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000051'::uuid,
    '2471059',
    'RK-562',
    'ACEVEDO RIVEROS DAHYAN STEFANY 213',
    'SEPARACION $1.475.000 y DEPOSITO $2.950.000 LOCAL 213  ',
    '2024-05-31',
    '2024-05-16',
    '2024-05-16',
    31,
    684,
    -2950000.0,
    -2950000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000030'::uuid,
    '2490159',
    'RK-602',
    'PUENTES DENARVAEZ ASTRID CAROLINA 515',
    'DEPOSITO LOCAL 515   ',
    '2024-06-30',
    '2024-06-30',
    '2024-06-30',
    31,
    654,
    -2750000.0,
    -2750000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000021'::uuid,
    '2513874',
    'RK-654',
    'AGENCIA GRAFISIGLO 21 SAS 210',
    'COMPLETA EL SALDO DE LA SEPARACION POR $480.000 Y ABONA A DEPOSITO DEL LOCAL 210-212 $3.520.000. PENDIENTE COMPLETAR EL SALDO DEL DEPOSITO ($1.440.000)    ',
    '2024-07-30',
    '2024-07-17',
    '2024-07-17',
    10,
    624,
    -3520000.0,
    -3520000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000043'::uuid,
    '2578400',
    'RK-811',
    'ANZOLA LOYO ANYERBERT ARTURO 519',
    'DEPOSITO POR $1.425.000 Y SEPARACION POR $712.500 LC 519  ',
    '2024-10-31',
    '2024-10-22',
    '2024-10-22',
    31,
    531,
    -1425000.0,
    -1425000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000031'::uuid,
    '2607535',
    'RK-868',
    'REBELARTE COMUNICACION VISUAL SAS 416',
    'CANCELA PRESTAMO LOCAL 414 MES NOVIEMBRE 2024',
    '2024-11-30',
    '2024-11-15',
    '2024-11-15',
    31,
    501,
    -900000.0,
    -900000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000022'::uuid,
    '2607788',
    'RK-875',
    'CICLO CREATIVO SAS 506A',
    'DEPOSITO POR $1.025.000 Y SEPARACION DEL LOCAL POR $512.500 LC 506B  ',
    '2024-11-30',
    '2024-11-01',
    '2024-11-01',
    31,
    501,
    -1025000.0,
    -1025000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000019'::uuid,
    '2916304',
    'FVS-72677',
    'FUSION GRAFIK SAS 117',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    4434969.0,
    4434969.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000024'::uuid,
    '2916368',
    'FVS-72695',
    'IMPROEXPRESS SAS 108',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    1787839.0,
    1787839.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000008'::uuid,
    '2916397',
    'FVS-72704',
    'THE PELICULA PUBLICIDAD SAS 304',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    5219791.0,
    5219791.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000052'::uuid,
    '2916496',
    'FVS-72713',
    'MORALES CLAVIJO JUAN FELIPE 303',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    2535057.0,
    2535057.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000032'::uuid,
    '2919830',
    'FVS-72842',
    'PRIORITY PRINT SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    346250.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000034'::uuid,
    '2919844',
    'FVS-72845',
    'NC GRAPHICS S.A.S. SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -178200.0,
    -178200.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000035'::uuid,
    '2919856',
    'FVS-72846',
    'MARTINEZ CADENA DORA CONSTANZA SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    83050.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000024'::uuid,
    '2919876',
    'FVS-72849',
    'IMPROEXPRESS SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -120800.0,
    -120800.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000036'::uuid,
    '2919890',
    'FVS-72854',
    'ACRILICOS INFINITO SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    72950.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000019'::uuid,
    '2919892',
    'FVS-72855',
    'FUSION GRAFIK SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    490150.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000005'::uuid,
    '2920058',
    'FVS-72860',
    'SOLUCIONES GRAFICAS ATR SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -67850.0,
    -67850.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000023'::uuid,
    '2228645',
    'RK-118',
    'IMAGENN & PUNTO SAS 508',
    'DEPOSITO  ',
    '2023-07-27',
    '2023-07-10',
    '2023-07-10',
    31,
    993,
    -3000000.0,
    -3000000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000018'::uuid,
    '2393365',
    'RK-385',
    'GO CREATIVE SAS 113',
    '3 MESES ANTICIPADOS DE ARRIENDO (MARZO-ABRIL-MAYO 2024)  ',
    '2024-02-09',
    '2024-02-02',
    '2024-02-02',
    10,
    796,
    -229950.0,
    -229950.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000037'::uuid,
    '2395950',
    'RK-405',
    'BECERRA MATEUS AGUSTINA 120',
    'CANCELA FVS-43953 10% DCTO Y CRUCE SEPARACION RK-334 POR $1,675,000   QUEDA SALDO DE $50.000 PARA SUMAR AL DEPOSITO',
    '2024-02-14',
    '2024-02-09',
    '2024-02-09',
    31,
    791,
    -50000.0,
    -50000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000007'::uuid,
    '2452396',
    'RK-515',
    'BUSTOS URIBE CARLOS ANDRES 214',
    'ABONO AL DEPOSITO LOCAL 214',
    '2024-04-30',
    '2024-04-04',
    '2024-04-04',
    31,
    715,
    -600000.0,
    -600000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000044'::uuid,
    '2557404',
    'RK-759',
    'RUIZ FRANCO EDER DAVID 104',
    'DEPOSITO POR $1.575.000 Y SEPARACION POR $787.500 LOCAL 104  ',
    '2024-09-30',
    '2024-09-30',
    '2024-09-30',
    10,
    562,
    -1575000.0,
    -1575000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000024'::uuid,
    '2580605',
    'RK-814',
    'IMPROEXPRESS SAS 108',
    'CANCELA FVS-52020 Y ABONO FACT NOV  ',
    '2024-10-31',
    '2024-10-28',
    '2024-10-28',
    31,
    531,
    -79800.0,
    -79800.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000027'::uuid,
    '2670202',
    'RK-1046',
    'PATARROYO PAEZ ADRIANA YAZMIN 310',
    'SEPARACION $1.125.000  DEPOSITO $ 2.250.000  LOCAL 313',
    '2025-02-26',
    '2025-02-19',
    '2025-02-19',
    31,
    413,
    -2250000.0,
    -2250000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000022'::uuid,
    '2692475',
    'RK-1124',
    'CICLO CREATIVO SAS 506A',
    'SEPARACION:$1.25.000, DEPOSITO: $2.050.000, Local 506A  ',
    '2025-03-26',
    '2025-03-26',
    '2025-03-26',
    31,
    385,
    -2050000.0,
    -2050000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000040'::uuid,
    '2898622',
    'FVS-71543',
    'FAJARDO NIVIA RENATO ALEJANDRO 302',
    '',
    '2026-03-02',
    '2026-03-12',
    '2026-03-12',
    31,
    44,
    3510500.0,
    3510500.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000052'::uuid,
    '2898626',
    'FVS-71544',
    'MORALES CLAVIJO JUAN FELIPE 303',
    '',
    '2026-03-02',
    '2026-03-12',
    '2026-03-12',
    31,
    44,
    2535057.0,
    2535057.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000023'::uuid,
    '2899000',
    'FVS-71578',
    'IMAGENN & PUNTO SAS 516',
    '',
    '2026-03-03',
    '2026-03-13',
    '2026-03-13',
    31,
    43,
    3705933.0,
    3705933.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000032'::uuid,
    '2909800',
    'NCF-1281',
    'PRIORITY PRINT SAS 102',
    'SALDO RETENCION CERTIFICADA FVS-58935',
    '2025-12-31',
    '2025-12-31',
    '2025-12-31',
    31,
    105,
    -45105.0,
    -45105.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000026'::uuid,
    '2916381',
    'FVS-72701',
    'RINCON PINZON MARGIE KATHERINE 301',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    3391500.0,
    3391500.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000011'::uuid,
    '2916500',
    'FVS-72715',
    'ACRIGROUP DISEÑO Y PUBLICIDAD SAS 501',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    4156897.0,
    4156897.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000029'::uuid,
    '2916642',
    'FVS-72723',
    'GALINDO ROA JOSE POLIDORO 513',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    3320582.0,
    3320582.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000017'::uuid,
    '2208153',
    'RK-98',
    'PUBLISERVIS SAS 504',
    'ABONO',
    '2023-06-29',
    '2023-06-28',
    '2023-06-28',
    31,
    1021,
    -3900000.0,
    -3900000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000019'::uuid,
    '2279078',
    'RK-213',
    'FUSION GRAFIK SAS 117',
    'DEPOSITO',
    '2023-09-30',
    '2023-09-30',
    '2023-09-30',
    31,
    928,
    -800000.0,
    -800000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000002'::uuid,
    '2388335',
    'RK-372',
    'VISUAL GRAPHIC SAS 106',
    'LOCAL 106 $2,950,000 DEPOSITO Y $1,475,000 DE SEPARACION  ',
    '2024-01-31',
    '2024-01-11',
    '2024-01-11',
    31,
    805,
    -3299575.0,
    -3299575.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000018'::uuid,
    '2393322',
    'RK-381',
    'GO CREATIVE SAS 113',
    'DEPOSITO  ',
    '2024-02-09',
    '2024-02-01',
    '2024-02-01',
    10,
    796,
    -200000.0,
    -200000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000006'::uuid,
    '2451003',
    'RK-502',
    'PRODUCTOR DE HERRAJES COLOMBIANOS 209',
    'DEPOSITO LOCAL 209  ',
    '2024-04-30',
    '2024-04-10',
    '2024-04-10',
    31,
    715,
    -2350000.0,
    -2350000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000029'::uuid,
    '2654836',
    'RKM-7',
    'GALINDO ROA JOSE POLIDORO 513',
    'DEPOSITO POR $1.475.000 Y SEPRACION POR $737.500 LC 513  ',
    '2024-12-31',
    '2024-11-15',
    '2024-11-15',
    31,
    470,
    -1475000.0,
    -1475000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000004'::uuid,
    '2722091',
    'RK-1311',
    'MARKCREATIVA SAS 115',
    'DEPOSITO LOCAL 115',
    '2025-05-28',
    '2025-05-23',
    '2025-05-23',
    31,
    322,
    -3560000.0,
    -3560000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000050'::uuid,
    '2778358',
    'RK-1715',
    'RUEFIN GROUP SAS 208',
    'DEPOSITO $2.893.000 SEPARACION $1.446.500 LOCAL 208  ',
    '2025-08-01',
    '2025-08-01',
    '2025-08-01',
    31,
    257,
    -2893000.0,
    -2893000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000005'::uuid,
    '2781010',
    'RK-1729',
    'SOLUCIONES GRAFICAS ATR SAS 119',
    'DEPOSITO $3.650.000 Y DEPOSITO $1.825.000 LOCAL 119  ',
    '2025-08-30',
    '2025-08-30',
    '2025-08-30',
    31,
    228,
    -3649999.0,
    -3649999.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000030'::uuid,
    '2894274',
    'RK-2624',
    'PUENTES DENARVAEZ ASTRID CAROLINA 515',
    'FVS- 70883-CONSUMO ENERGIA LOCAL 515  ',
    '2026-02-19',
    '2026-02-19',
    '2026-02-19',
    31,
    55,
    -2000.0,
    -2000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000031'::uuid,
    '2909798',
    'NCF-1280',
    'REBELARTE COMUNICACION VISUAL SAS 416',
    'ACTIVACION SALDO A FAVOR FVS-60924 - 60925 RTE FUENTE 3,5%',
    '2025-12-31',
    '2025-12-31',
    '2025-12-31',
    31,
    105,
    -74725.0,
    -74725.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000024'::uuid,
    '2916152',
    'FVS-72667',
    'IMPROEXPRESS SAS 110',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    3274425.0,
    3274425.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000012'::uuid,
    '2916356',
    'FVS-72690',
    'SANABRIA FRANKY MARIA ANGELICA 204',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    1710444.0,
    1710444.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000023'::uuid,
    '2916646',
    'FVS-72725',
    'IMAGENN & PUNTO SAS 516',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    3705933.0,
    3705933.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000001'::uuid,
    '2919827',
    'FVS-72841',
    'MEDIOS IMPRESOS S.A.S SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -88150.0,
    -88150.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000044'::uuid,
    '2919838',
    'FVS-72844',
    'RUIZ FRANCO EDER DAVID SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    10,
    4,
    147050.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000040'::uuid,
    '2919884',
    'FVS-72852',
    'FAJARDO NIVIA RENATO ALEJANDRO SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    249700.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000010'::uuid,
    '2920071',
    'FVS-72864',
    'NIETO VILLALBA HEIDY DAYANA SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    362950.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000050'::uuid,
    '2920086',
    'FVS-72870',
    'RUEFIN GROUP SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    81850.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000007'::uuid,
    '2920101',
    'FVS-72876',
    'BUSTOS URIBE CARLOS ANDRES SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    338650.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000036'::uuid,
    '2165211',
    'RK-51',
    'ACRILICOS INFINITO SAS 116',
    'SEPARACION LOCAL 116',
    '2023-04-30',
    '2023-04-30',
    '2023-04-30',
    31,
    1081,
    -1650000.0,
    -1650000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000017'::uuid,
    '2188030',
    'RK-71',
    'PUBLISERVIS SAS 504',
    'ANTICIPO SEPARACION LOCAL 504',
    '2023-05-30',
    '2023-05-18',
    '2023-05-18',
    31,
    1051,
    -2800000.0,
    -2800000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000018'::uuid,
    '2388402',
    'RK-373',
    'GO CREATIVE SAS 113',
    'DEPOSITO $3,450,000  ',
    '2024-01-31',
    '2024-01-31',
    '2024-01-31',
    10,
    805,
    -3450000.0,
    -3450000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000008'::uuid,
    '2463183',
    'RK-543',
    'THE PELICULA PUBLICIDAD SAS 304',
    'CANCELA FVS-46694, QUEDA SALDO A FAVOR, EL CLIENTE NO SE TOMO DCTO 10%  ',
    '2024-05-23',
    '2024-05-10',
    '2024-05-10',
    31,
    692,
    -301000.0,
    -301000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000007'::uuid,
    '2463254',
    'RK-552',
    'BUSTOS URIBE CARLOS ANDRES 214',
    '50% DEPOSITO AUTORIZADO',
    '2024-05-23',
    '2024-05-14',
    '2024-05-14',
    31,
    692,
    -800000.0,
    -800000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000021'::uuid,
    '2513893',
    'RK-658',
    'AGENCIA GRAFISIGLO 21 SAS 210',
    'SALDO DEPOSITO LOCAL 210-212  ',
    '2024-07-30',
    '2024-07-18',
    '2024-07-18',
    10,
    624,
    -1440000.0,
    -1440000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000026'::uuid,
    '2513925',
    'RK-665',
    'RINCON PINZON MARGIE KATHERINE 301',
    'SEPARACION LOCAL 307 MARGIE',
    '2024-07-30',
    '2024-07-23',
    '2024-07-23',
    31,
    624,
    -2000000.0,
    -2000000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000049'::uuid,
    '2655947',
    'RK-986',
    'MATICES COMUNICACION VISUAL SAS 123',
    'DEPOSITO PO $4.400.000 Y SEPARACION LC 123 $1.125.000 Y LC 125 $1.075.000  ',
    '2025-01-31',
    '2025-01-23',
    '2025-01-23',
    31,
    439,
    -4400000.0,
    -4400000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000058'::uuid,
    '2778362',
    'RK-1716',
    'OKAR DISTRIBUCIONES SAS 314',
    'DEPOSITO $2.350.000, SEPARACION $1.175.000 LOCAL 314  ',
    '2025-08-13',
    '2025-08-13',
    '2025-08-13',
    31,
    245,
    -2350000.0,
    -2350000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000024'::uuid,
    '2898547',
    'FVS-71526',
    'IMPROEXPRESS SAS 110',
    '',
    '2026-03-02',
    '2026-03-12',
    '2026-03-12',
    31,
    44,
    3274425.0,
    3274425.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000026'::uuid,
    '2898618',
    'FVS-71542',
    'RINCON PINZON MARGIE KATHERINE 301',
    '',
    '2026-03-02',
    '2026-03-12',
    '2026-03-12',
    31,
    44,
    3391500.0,
    3391500.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000045'::uuid,
    '2916362',
    'FVS-72693',
    'SAVATAR PUBLICIDAD SAS 207',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    2733885.0,
    2733885.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000023'::uuid,
    '2916668',
    'FVS-72736',
    'IMAGENN & PUNTO SAS 508',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    13061895.0,
    13061895.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000033'::uuid,
    '2919836',
    'FVS-72843',
    'HERNANDEZ CRUZ YEIDY ALEJANDRA SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -191050.0,
    -191050.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000035'::uuid,
    '2919872',
    'FVS-72848',
    'MARTINEZ CADENA DORA CONSTANZA SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -384700.0,
    -384700.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000004'::uuid,
    '2919887',
    'FVS-72853',
    'MARKCREATIVA SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    195500.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000036'::uuid,
    '2919890',
    'FVS-72854',
    'ACRILICOS INFINITO SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -72950.0,
    -72950.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000019'::uuid,
    '2919892',
    'FVS-72855',
    'FUSION GRAFIK SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -490150.0,
    -490150.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000049'::uuid,
    '2920065',
    'FVS-72863',
    'MATICES COMUNICACION VISUAL SAS SERVICIO',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    139150.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000049'::uuid,
    '2920073',
    'FVS-72865',
    'MATICES COMUNICACION VISUAL SAS SERVICIO',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -182350.0,
    -182350.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000010'::uuid,
    '2343246',
    'RKM-6',
    'NIETO VILLALBA HEIDY DAYANA 124',
    'DEPOSITO CAFETERIA',
    '2023-11-30',
    '2023-11-30',
    '2023-11-30',
    31,
    867,
    -2000000.0,
    -2000000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000026'::uuid,
    '2513919',
    'RK-663',
    'RINCON PINZON MARGIE KATHERINE 301',
    'SEPARACION LOCAL 307',
    '2024-07-30',
    '2024-07-26',
    '2024-07-26',
    31,
    624,
    -50000.0,
    -50000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000035'::uuid,
    '2599420',
    'RK-831',
    'MARTINEZ CADENA DORA CONSTANZA 107',
    'DEPOSITO LOCAL 107 $1.825.000 Y SEPARACION POR $912.500',
    '2024-11-27',
    '2024-11-05',
    '2024-11-05',
    31,
    504,
    -1825000.0,
    -1825000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000015'::uuid,
    '2699882',
    'RK-1185',
    'LASSO MONTENEGRO LUIS FERNANDO 507',
    'DEPOSITO $2.850.000  SEPARACION $1.425.000  Local 507',
    '2025-04-21',
    '2025-04-03',
    '2025-04-03',
    31,
    359,
    -2850000.0,
    -2850000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000038'::uuid,
    '2757094',
    'RK-1589',
    'MUISCAS PUBLICIDAD S.A.S 122',
    'DEPOSITO $3.050.000 Y SEPARACION $1.525.000 LOCAL 122',
    '2025-07-24',
    '2025-07-09',
    '2025-07-09',
    31,
    265,
    -3050000.0,
    -3050000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000001'::uuid,
    '2777685',
    'RK-1714',
    'MEDIOS IMPRESOS S.A.S. 101',
    'DEPOSITO $3.650.000 SEPARACION $1.825.000 LOCAL 118  ',
    '2025-08-22',
    '2025-08-22',
    '2025-08-22',
    31,
    236,
    -3650000.0,
    -3650000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000057'::uuid,
    '2778370',
    'RK-1718',
    'RODRIGUEZ CARRERO DIANA CATHERINE 313',
    'DEPOSITO LOCAL 313  ',
    '2025-08-26',
    '2025-08-26',
    '2025-08-26',
    31,
    232,
    -775000.0,
    -775000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000050'::uuid,
    '2798903',
    'RK-1869',
    'RUEFIN GROUP SAS 208',
    'DEPOSITO $ 2.550.000  SEPARACION $1.275.000 LOCAL 807  ',
    '2025-09-25',
    '2025-09-25',
    '2025-09-25',
    31,
    202,
    -2550000.0,
    -2550000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000022'::uuid,
    '2863253',
    'RK-2332',
    'CICLO CREATIVO SAS 506A',
    'FVS-68424 SALDO DICIEMBRE- FVS-68857-FVS-68858 ENERGIA NOVIEMBRE LOCAL 506A Y 506-B  ',
    '2025-12-24',
    '2025-12-24',
    '2025-12-24',
    31,
    112,
    -27142.0,
    -27142.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000023'::uuid,
    '2881119',
    'FVS-70571',
    'IMAGENN & PUNTO SAS 508',
    'ARRIENDO LOCAL 508-510-512-514  DEL 1 AL 28 DE FEBRERO DEL 2026',
    '2026-02-02',
    '2026-02-12',
    '2026-02-12',
    31,
    72,
    13061895.0,
    13061895.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000040'::uuid,
    '2898493',
    'FVS-71518',
    'FAJARDO NIVIA RENATO ALEJANDRO 114',
    '',
    '2026-03-02',
    '2026-03-12',
    '2026-03-12',
    31,
    44,
    2828811.0,
    2828811.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000022'::uuid,
    '2898689',
    'FVS-71560',
    'CICLO CREATIVO SAS 506A',
    '',
    '2026-03-02',
    '2026-03-12',
    '2026-03-12',
    31,
    44,
    2130975.0,
    2130975.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000053'::uuid,
    '2898753',
    'FVS-71561',
    'RAMIREZ JIMENEZ JEISON STEVEN 509',
    '',
    '2026-03-02',
    '2026-03-12',
    '2026-03-12',
    31,
    44,
    61737.0,
    61737.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000023'::uuid,
    '2898788',
    'FVS-71562',
    'IMAGENN & PUNTO SAS 508',
    '',
    '2026-03-02',
    '2026-03-12',
    '2026-03-12',
    31,
    44,
    13061895.0,
    13061895.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000042'::uuid,
    '2916502',
    'FVS-72716',
    'ARRIERO LUNA ANDRES ESNEIDER 502',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    3284400.0,
    3284400.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000001'::uuid,
    '2919827',
    'FVS-72841',
    'MEDIOS IMPRESOS S.A.S SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    88150.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000044'::uuid,
    '2919838',
    'FVS-72844',
    'RUIZ FRANCO EDER DAVID SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    10,
    4,
    -147050.0,
    -147050.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000024'::uuid,
    '2919862',
    'FVS-72847',
    'IMPROEXPRESS SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -151150.0,
    -151150.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000031'::uuid,
    '2241218',
    'RK-141',
    'REBELARTE COMUNICACION VISUAL SAS 416',
    'ABONO',
    '2023-08-14',
    '2023-08-08',
    '2023-08-08',
    31,
    975,
    -1434975.0,
    -1434975.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000008'::uuid,
    '2388577',
    'RK-375',
    'THE PELICULA PUBLICIDAD SAS 304',
    'DEPOSITO $2,050,000  ',
    '2024-01-31',
    '2024-01-30',
    '2024-01-30',
    31,
    805,
    -2050000.0,
    -2050000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000046'::uuid,
    '2431557',
    'RK-462',
    'IN - DESIGN SAS 211',
    'DEPOSITO 3,650,000  ',
    '2024-03-30',
    '2024-03-14',
    '2024-03-14',
    31,
    746,
    -3650000.0,
    -3650000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000008'::uuid,
    '2479344',
    'RK-584',
    'THE PELICULA PUBLICIDAD SAS 304',
    'CANCELA FVS-47739 (SE REVERSA RTFTE) CLIENTE NO SE TOMA EL DESCUENTO 10% PP, QUEDA SALDO A FAVOR DCTO  ',
    '2024-06-18',
    '2024-06-06',
    '2024-06-06',
    31,
    666,
    -301000.0,
    -301000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000024'::uuid,
    '2607597',
    'RK-870',
    'IMPROEXPRESS SAS 108',
    'DEPOSITO $1.575.000 Y SEPRACION $787.500 LC 110  ',
    '2024-11-30',
    '2024-11-15',
    '2024-11-15',
    31,
    501,
    -1575000.0,
    -1575000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000053'::uuid,
    '2607619',
    'RK-871',
    'RAMIREZ JIMENEZ JEISON STEVEN 509',
    'RAMIREZ JIMENEZ JEISON STEVEN  ',
    '2024-11-30',
    '2024-11-25',
    '2024-11-25',
    31,
    501,
    -2650000.0,
    -2650000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000028'::uuid,
    '2655946',
    'RK-985',
    'LEAL GALARZA HENRY 415',
    'DEPOSITO $1.750.000 Y SEPARACION $875.000  ',
    '2025-01-31',
    '2025-01-18',
    '2025-01-18',
    31,
    439,
    -1750000.0,
    -1750000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000042'::uuid,
    '2898676',
    'FVS-71557',
    'ARRIERO LUNA ANDRES ESNEIDER 502',
    '',
    '2026-03-02',
    '2026-03-12',
    '2026-03-12',
    31,
    44,
    3284400.0,
    3284400.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000002'::uuid,
    '2903478',
    'FVS-71773',
    'VISUAL GRAPHIC SAS SERVICIOS P',
    '',
    '2026-03-10',
    '2026-03-10',
    '2026-03-20',
    31,
    36,
    50.0,
    50.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000036'::uuid,
    '2916302',
    'FVS-72676',
    'ACRILICOS INFINITO SAS 116',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    4434969.0,
    4434969.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000005'::uuid,
    '2916306',
    'FVS-72678',
    'SOLUCIONES GRAFICAS ATR SAS 119',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    4215750.0,
    4215750.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000037'::uuid,
    '2916308',
    'FVS-72679',
    'BECERRA MATEUS AGUSTINA 120',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    3629500.0,
    3629500.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000040'::uuid,
    '2916390',
    'FVS-72702',
    'FAJARDO NIVIA RENATO ALEJANDRO 302',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    3689536.0,
    3689536.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000047'::uuid,
    '2916490',
    'FVS-72710',
    'TRIANA ESTUPIÑAN PAULA INES 414',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    1851021.0,
    1851021.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000043'::uuid,
    '2916652',
    'FVS-72728',
    'ANZOLA LOYO ANYERBERT ARTURO 519',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    2713200.0,
    2713200.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000032'::uuid,
    '2919830',
    'FVS-72842',
    'PRIORITY PRINT SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -346250.0,
    -346250.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000035'::uuid,
    '2919856',
    'FVS-72846',
    'MARTINEZ CADENA DORA CONSTANZA SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -83050.0,
    -83050.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000035'::uuid,
    '2919872',
    'FVS-72848',
    'MARTINEZ CADENA DORA CONSTANZA SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    384700.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000005'::uuid,
    '2920058',
    'FVS-72860',
    'SOLUCIONES GRAFICAS ATR SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    67850.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000049'::uuid,
    '2920065',
    'FVS-72863',
    'MATICES COMUNICACION VISUAL SAS SERVICIO',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -139150.0,
    -139150.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000038'::uuid,
    '2920063',
    'FVS-72862',
    'MUISCAS PUBLICIDAD S.A.S SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    201150.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000011'::uuid,
    '2920078',
    'FVS-72867',
    'ACRIGROUP DISEÑO Y PUBLICIDAD SAS SERVIC',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -448150.0,
    -448150.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000021'::uuid,
    '2920090',
    'FVS-72872',
    'AGENCIA GRAFISIGLO 21 SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    10,
    4,
    340200.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000015'::uuid,
    '2920112',
    'FVS-72879',
    'LASSO MONTENEGRO LUIS FERNANDO SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    78700.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000030'::uuid,
    '2920128',
    'FVS-72884',
    'PUENTES DENARVAEZ ASTRID CAROLINA SERVIC',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    397950.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000050'::uuid,
    '2920159',
    'FVS-72897',
    'RUEFIN GROUP SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -292450.0,
    -292450.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000052'::uuid,
    '2920165',
    'FVS-72899',
    'MORALES CLAVIJO JUAN FELIPE SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    159150.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000008'::uuid,
    '2920168',
    'FVS-72900',
    'THE PELICULA PUBLICIDAD SAS 304',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    339850.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000056'::uuid,
    '2920175',
    'FVS-72901',
    'SALAS MONCADA YAMIL RAFAEL SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    88400.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000028'::uuid,
    '2920204',
    'FVS-72911',
    'LEAL GALARZA HENRY SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -49350.0,
    -49350.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000031'::uuid,
    '2920206',
    'FVS-72912',
    'REBELARTE COMUNICACION VISUAL SAS SERVIC',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    487750.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000017'::uuid,
    '2920259',
    'FVS-72929',
    'PUBLISERVIS SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -330850.0,
    -330850.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000022'::uuid,
    '2920266',
    'FVS-72932',
    'CICLO CREATIVO SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    40150.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000053'::uuid,
    '2920118',
    'FVS-72881',
    'RAMIREZ JIMENEZ JEISON STEVEN SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -194500.0,
    -194500.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000029'::uuid,
    '2920123',
    'FVS-72883',
    'GALINDO ROA JOSE POLIDORO SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    270000.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000016'::uuid,
    '2920131',
    'FVS-72886',
    'INKU.CA SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -155850.0,
    -155850.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000017'::uuid,
    '2920146',
    'FVS-72892',
    'PUBLISERVIS SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -135350.0,
    -135350.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000041'::uuid,
    '2920184',
    'FVS-72904',
    'CASTIBLANCO CLAROS HAROLD GUSTAVO SERVIC',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    273150.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000047'::uuid,
    '2920199',
    'FVS-72909',
    'TRIANA ESTUPIÑAN PAULA INES SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    414850.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000002'::uuid,
    '2920233',
    'FVS-72920',
    'VISUAL GRAPHIC SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -160050.0,
    -160050.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000018'::uuid,
    '2920237',
    'FVS-72921',
    'GO CREATIVE SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    10,
    4,
    283800.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000040'::uuid,
    '2408188',
    'RK-423',
    'FAJARDO NIVIA RENATO ALEJANDRO 114',
    'DEPOSITO LOCAL 302  ',
    '2024-02-29',
    '2024-02-27',
    '2024-02-27',
    31,
    776,
    -3000000.0,
    -3000000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000008'::uuid,
    '2438383',
    'RK-488',
    'THE PELICULA PUBLICIDAD SAS 304',
    'DEPOSITO Y SEPARACION',
    '2024-04-17',
    '2024-01-15',
    '2024-01-15',
    31,
    728,
    -2250000.0,
    -2250000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000031'::uuid,
    '2450865',
    'RK-493',
    'REBELARTE COMUNICACION VISUAL SAS 416',
    'LOCAL 416 - DEPOSITO $2.700.000 Y SEPARACION $1.350.000  ',
    '2024-04-30',
    '2024-04-15',
    '2024-04-15',
    31,
    715,
    -2700000.0,
    -2700000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000011'::uuid,
    '2513906',
    'RK-659',
    'ACRIGROUP DISEÑO Y PUBLICIDAD SAS 202',
    'CANCELA FVS-47713 Y QUEDA SALDO A FAVOR QUE SE DEBE CONCILIAR CON EL CLIENTE',
    '2024-07-30',
    '2024-07-03',
    '2024-07-03',
    31,
    624,
    -519947.0,
    -519947.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000056'::uuid,
    '2535007',
    'RK-681',
    'SALAS MONCADA YAMIL RAFAEL 305',
    'LOCAL 308 DEPOSITO $2.050.000 Y SEPARACION $1.025.000  ',
    '2024-08-31',
    '2024-08-03',
    '2024-08-03',
    31,
    592,
    -2050000.0,
    -2050000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000042'::uuid,
    '2557467',
    'RK-762',
    'ARRIERO LUNA ANDRES ESNEIDER 502',
    'SEPARACIÓN LOCAL 502 POR $862,500 Y DEPOSITO POR $1,725,000  ',
    '2024-09-30',
    '2024-09-16',
    '2024-09-16',
    31,
    562,
    -1725000.0,
    -1725000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000009'::uuid,
    '2607532',
    'RK-867',
    'ALARCON PIRACHICAN JOHN FREDDY 312',
    'DEPOSITO $2.150.000 Y SEPRACION $895.475  ',
    '2024-11-30',
    '2024-11-29',
    '2024-11-29',
    31,
    501,
    -2150525.0,
    -2150525.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000031'::uuid,
    '2674626',
    'RK-1059',
    'REBELARTE COMUNICACION VISUAL SAS 416',
    'SEPARACION: $725.000  DEPOSITO: $1.450.000 LOCAL 803',
    '2025-02-25',
    '2025-02-25',
    '2025-02-25',
    31,
    414,
    -1450000.0,
    -1450000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000013'::uuid,
    '2709144',
    'RK-1199',
    'TICETTE STILE SAS 308',
    'DEPOSITO POR $2.262.000 Y SEPRACION POR $2.262.000 LC 308',
    '2025-04-30',
    '2025-04-23',
    '2025-04-23',
    31,
    350,
    -3393000.0,
    -3393000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000052'::uuid,
    '2721380',
    'RK-1292',
    'MORALES CLAVIJO JUAN FELIPE 205',
    'DEPOSITO $2.367.000 SEPARACION $1.183.500 LOCAL 303  ',
    '2025-05-27',
    '2025-05-15',
    '2025-05-15',
    31,
    323,
    -2367000.0,
    -2367000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000041'::uuid,
    '2725849',
    'RK-1329',
    'CASTIBLANCO CLAROS HAROLD GUSTAVO 307',
    'DEPOSITO $2.157.000 SEPARACION $1.078.500 LOCAL 307  ',
    '2025-05-12',
    '2025-05-12',
    '2025-05-12',
    31,
    338,
    -2157000.0,
    -2157000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000025'::uuid,
    '2733555',
    'RK-1374',
    'MI MUG SAS 201',
    'DEPOSITO $5.850.000, SEPARACION $2.925.000 LOCAL 201-203  ',
    '2025-06-17',
    '2025-06-09',
    '2025-06-09',
    31,
    302,
    -5850000.0,
    -5850000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000057'::uuid,
    '2778369',
    'RK-1717',
    'RODRIGUEZ CARRERO DIANA CATHERINE 313',
    'SEPARACION $1.125.000  ABONO DEPOSITO $350,000 LOCAL 313  ',
    '2025-08-26',
    '2025-08-26',
    '2025-08-26',
    31,
    232,
    -1475000.0,
    -1475000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000040'::uuid,
    '2897037',
    'FVS-71323',
    'FAJARDO NIVIA RENATO ALEJANDRO 114',
    'COBRO MORA FVS ENERO LOCAL 114',
    '2026-02-27',
    '2026-02-27',
    '2026-03-07',
    31,
    47,
    76874.0,
    76874.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000024'::uuid,
    '2898398',
    'FVS-71495',
    'IMPROEXPRESS SAS 108',
    '',
    '2026-03-02',
    '2026-03-12',
    '2026-03-12',
    31,
    44,
    1787839.0,
    1787839.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000011'::uuid,
    '2898672',
    'FVS-71556',
    'ACRIGROUP DISEÑO Y PUBLICIDAD SAS 501',
    '',
    '2026-03-02',
    '2026-03-12',
    '2026-03-12',
    31,
    44,
    3926276.0,
    3926276.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000022'::uuid,
    '2899002',
    'FVS-71579',
    'CICLO CREATIVO SAS 506B',
    '',
    '2026-03-03',
    '2026-03-13',
    '2026-03-13',
    31,
    43,
    2367750.0,
    2367750.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000037'::uuid,
    '2919879',
    'FVS-72850',
    'BECERRA MATEUS AGUSTINA SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    181900.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000004'::uuid,
    '2919887',
    'FVS-72853',
    'MARKCREATIVA SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -195500.0,
    -195500.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000001'::uuid,
    '2919896',
    'FVS-72856',
    'MEDIOS IMPRESOS S.A.S SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    197550.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000020'::uuid,
    '2920061',
    'FVS-72861',
    'NEOGRAFICK S.A.S. SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    222800.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000052'::uuid,
    '2920084',
    'FVS-72869',
    'MORALES CLAVIJO JUAN FELIPE SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -198850.0,
    -198850.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000050'::uuid,
    '2920086',
    'FVS-72870',
    'RUEFIN GROUP SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -81850.0,
    -81850.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000051'::uuid,
    '2920095',
    'FVS-72874',
    'ACEVEDO RIVEROS DAHYAN STEFANY SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -284250.0,
    -284250.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000055'::uuid,
    '2920140',
    'FVS-72890',
    'KIADOM AGENCIA CREATIVA SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    112850.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000059'::uuid,
    '2920142',
    'FVS-72891',
    'CODIGO PURPURA SA SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    10,
    4,
    189750.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000041'::uuid,
    '2920184',
    'FVS-72904',
    'CASTIBLANCO CLAROS HAROLD GUSTAVO SERVIC',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -273150.0,
    -273150.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000013'::uuid,
    '2920189',
    'FVS-72906',
    'TICETTE STILE SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    140850.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000058'::uuid,
    '2920197',
    'FVS-72908',
    'OKAR DISTRIBUCIONES SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    131900.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000022'::uuid,
    '2920271',
    'FVS-72933',
    'CICLO CREATIVO SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -93850.0,
    -93850.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000025'::uuid,
    '2920076',
    'FVS-72866',
    'MI MUG SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -49350.0,
    -49350.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000006'::uuid,
    '2920088',
    'FVS-72871',
    'PRODUCTOR DE HERRAJES COLOMBIANOS SERVIC',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    47800.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000046'::uuid,
    '2920093',
    'FVS-72873',
    'IN - DESIGN SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -120100.0,
    -120100.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000011'::uuid,
    '2920106',
    'FVS-72877',
    'ACRIGROUP DISEÑO Y PUBLICIDAD SAS SERVIC',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    233000.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000054'::uuid,
    '2920120',
    'FVS-72882',
    'RODRIGUEZ MURILLO JAVIER SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -210800.0,
    -210800.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000043'::uuid,
    '2920138',
    'FVS-72889',
    'ANZOLA LOYO ANYERBERT ARTURO SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -251900.0,
    -251900.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000055'::uuid,
    '2920140',
    'FVS-72890',
    'KIADOM AGENCIA CREATIVA SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -112850.0,
    -112850.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000031'::uuid,
    '2920149',
    'FVS-72893',
    'REBELARTE COMUNICACION VISUAL SAS SERVIC',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    206000.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000026'::uuid,
    '2920156',
    'FVS-72896',
    'RINCON PINZON MARGIE KATHERINE SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -98150.0,
    -98150.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000039'::uuid,
    '2920244',
    'FVS-72923',
    'POP PUBLICIDAD & PROMOCIONALES SAS SERVI',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    10,
    4,
    106100.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000042'::uuid,
    '2920255',
    'FVS-72928',
    'ARRIERO LUNA ANDRES ESNEIDER SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    183750.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000027'::uuid,
    '2920277',
    'FVS-72935',
    'PATARROYO PAEZ ADRIANA YAZMIN SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -140050.0,
    -140050.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000009'::uuid,
    '2920308',
    'FVS-72944',
    'ALARCON PIRACHICAN JOHN FREDDY SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -85200.0,
    -85200.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000014'::uuid,
    '2921262',
    'FVS-72988',
    'TURISMO MAGICO S&M SAS SERVICIOS P',
    '',
    '2026-04-13',
    '2026-04-13',
    '2026-04-13',
    31,
    2,
    -83550.0,
    -83550.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000024'::uuid,
    '2919876',
    'FVS-72849',
    'IMPROEXPRESS SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    120800.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000040'::uuid,
    '2919884',
    'FVS-72852',
    'FAJARDO NIVIA RENATO ALEJANDRO SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -249700.0,
    -249700.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000020'::uuid,
    '2920061',
    'FVS-72861',
    'NEOGRAFICK S.A.S. SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -222800.0,
    -222800.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000010'::uuid,
    '2920071',
    'FVS-72864',
    'NIETO VILLALBA HEIDY DAYANA SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -362950.0,
    -362950.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000023'::uuid,
    '2920115',
    'FVS-72880',
    'IMAGENN & PUNTO SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -2023250.0,
    -2023250.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000029'::uuid,
    '2920123',
    'FVS-72883',
    'GALINDO ROA JOSE POLIDORO SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -270000.0,
    -270000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000059'::uuid,
    '2920142',
    'FVS-72891',
    'CODIGO PURPURA SA SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    10,
    4,
    -189750.0,
    -189750.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000017'::uuid,
    '2920146',
    'FVS-72892',
    'PUBLISERVIS SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    135350.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000040'::uuid,
    '2920161',
    'FVS-72898',
    'FAJARDO NIVIA RENATO ALEJANDRO SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    73500.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000008'::uuid,
    '2920168',
    'FVS-72900',
    'THE PELICULA PUBLICIDAD SAS 304',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -339850.0,
    -339850.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000047'::uuid,
    '2920199',
    'FVS-72909',
    'TRIANA ESTUPIÑAN PAULA INES SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -414850.0,
    -414850.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000031'::uuid,
    '2920206',
    'FVS-72912',
    'REBELARTE COMUNICACION VISUAL SAS SERVIC',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -487750.0,
    -487750.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000002'::uuid,
    '2920233',
    'FVS-72920',
    'VISUAL GRAPHIC SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    160050.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000045'::uuid,
    '2920250',
    'FVS-72926',
    'SAVATAR PUBLICIDAD SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    70400.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000014'::uuid,
    '2921262',
    'FVS-72988',
    'TURISMO MAGICO S&M SAS SERVICIOS P',
    '',
    '2026-04-13',
    '2026-04-13',
    '2026-04-21',
    31,
    2,
    83550.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000025'::uuid,
    '2920076',
    'FVS-72866',
    'MI MUG SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    49350.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000011'::uuid,
    '2920078',
    'FVS-72867',
    'ACRIGROUP DISEÑO Y PUBLICIDAD SAS SERVIC',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    448150.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000021'::uuid,
    '2920090',
    'FVS-72872',
    'AGENCIA GRAFISIGLO 21 SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    10,
    4,
    -340200.0,
    -340200.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000007'::uuid,
    '2920101',
    'FVS-72876',
    'BUSTOS URIBE CARLOS ANDRES SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -338650.0,
    -338650.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000015'::uuid,
    '2920112',
    'FVS-72879',
    'LASSO MONTENEGRO LUIS FERNANDO SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -78700.0,
    -78700.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000030'::uuid,
    '2920128',
    'FVS-72884',
    'PUENTES DENARVAEZ ASTRID CAROLINA SERVIC',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -397950.0,
    -397950.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000016'::uuid,
    '2920131',
    'FVS-72886',
    'INKU.CA SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    155850.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000048'::uuid,
    '2920135',
    'FVS-72888',
    'DISEÑOS Y SELLADOS BASTIDAS SAS SERVICI',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    10,
    4,
    24000.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000050'::uuid,
    '2920159',
    'FVS-72897',
    'RUEFIN GROUP SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    292450.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000056'::uuid,
    '2920175',
    'FVS-72901',
    'SALAS MONCADA YAMIL RAFAEL SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -88400.0,
    -88400.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000028'::uuid,
    '2920204',
    'FVS-72911',
    'LEAL GALARZA HENRY SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    49350.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000018'::uuid,
    '2920237',
    'FVS-72921',
    'GO CREATIVE SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    10,
    4,
    -283800.0,
    -283800.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000017'::uuid,
    '2920259',
    'FVS-72929',
    'PUBLISERVIS SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    330850.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000022'::uuid,
    '2920266',
    'FVS-72932',
    'CICLO CREATIVO SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -40150.0,
    -40150.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000037'::uuid,
    '2914823',
    'FVS-72471',
    'BECERRA MATEUS AGUSTINA 120',
    '',
    '2026-03-28',
    '2026-03-28',
    '2026-03-31',
    31,
    18,
    3629500.0,
    3629500.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000024'::uuid,
    '2919862',
    'FVS-72847',
    'IMPROEXPRESS SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    151150.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000037'::uuid,
    '2919879',
    'FVS-72850',
    'BECERRA MATEUS AGUSTINA SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -181900.0,
    -181900.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000003'::uuid,
    '2919881',
    'FVS-72851',
    'PLANETA GRAFICO SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    124600.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000001'::uuid,
    '2919896',
    'FVS-72856',
    'MEDIOS IMPRESOS S.A.S SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -197550.0,
    -197550.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000012'::uuid,
    '2920082',
    'FVS-72868',
    'SANABRIA FRANKY MARIA ANGELICA SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    204050.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000052'::uuid,
    '2920084',
    'FVS-72869',
    'MORALES CLAVIJO JUAN FELIPE SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    198850.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000051'::uuid,
    '2920095',
    'FVS-72874',
    'ACEVEDO RIVEROS DAHYAN STEFANY SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    284250.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000023'::uuid,
    '2920115',
    'FVS-72880',
    'IMAGENN & PUNTO SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    2023250.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000053'::uuid,
    '2920118',
    'FVS-72881',
    'RAMIREZ JIMENEZ JEISON STEVEN SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    194500.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000040'::uuid,
    '2920161',
    'FVS-72898',
    'FAJARDO NIVIA RENATO ALEJANDRO SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -73500.0,
    -73500.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000013'::uuid,
    '2920189',
    'FVS-72906',
    'TICETTE STILE SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -140850.0,
    -140850.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000058'::uuid,
    '2920197',
    'FVS-72908',
    'OKAR DISTRIBUCIONES SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -131900.0,
    -131900.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000045'::uuid,
    '2920250',
    'FVS-72926',
    'SAVATAR PUBLICIDAD SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -70400.0,
    -70400.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000022'::uuid,
    '2920271',
    'FVS-72933',
    'CICLO CREATIVO SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    93850.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000023'::uuid,
    '2208171',
    'RK-100',
    'IMAGENN & PUNTO SAS 508',
    'ABONO SEPARACION LOCAL',
    '2023-06-29',
    '2023-06-17',
    '2023-06-17',
    31,
    1021,
    -10700000.0,
    -10700000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000033'::uuid,
    '2578378',
    'RK-806',
    'HERNANDEZ CRUZ YEIDY ALEJANDRA 103',
    'DEPOSITO POR $1.087.500 Y SEPARACION POR $1.087.500',
    '2024-10-31',
    '2024-10-31',
    '2024-10-31',
    31,
    531,
    -1087500.0,
    -1087500.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000047'::uuid,
    '2669046',
    'RK-1030',
    'TRIANA ESTUPIÑAN PAULA INES 414',
    'SEPARACION: $925.000  DEPOSITO: $ 1.850.000  LOCAL 414',
    '2025-02-25',
    '2025-02-06',
    '2025-02-06',
    31,
    414,
    -1850000.0,
    -1850000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000014'::uuid,
    '2709143',
    'RK-1198',
    'TURISMO MAGICO S&M SAS 309',
    'DEPOSITO $2.262.000 Y SEPARACION POR $1.131.000 LC-308',
    '2025-04-30',
    '2025-04-22',
    '2025-04-22',
    31,
    350,
    -2262000.0,
    -2262000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000016'::uuid,
    '2818574',
    'RK-2029',
    'INKU.CA SAS 517',
    'SEPARCION $1.425.000 Y DEPOSITO $2.850.000 LOCAL 517  ',
    '2025-10-29',
    '2025-10-29',
    '2025-10-29',
    31,
    168,
    -2850000.0,
    -2850000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000036'::uuid,
    '2909858',
    'FVS-72182',
    'ACRILICOS INFINITO SAS INTERESES M',
    '',
    '2026-03-19',
    '2026-03-19',
    '2026-03-29',
    31,
    27,
    96900.0,
    96900.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000040'::uuid,
    '2916296',
    'FVS-72674',
    'FAJARDO NIVIA RENATO ALEJANDRO 114',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    2828811.0,
    2828811.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000051'::uuid,
    '2916376',
    'FVS-72699',
    'ACEVEDO RIVEROS DAHYAN STEFANY 213',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    1808400.0,
    1808400.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000022'::uuid,
    '2916634',
    'FVS-72719',
    'CICLO CREATIVO SAS 506B',
    '',
    '2026-04-01',
    '2026-04-11',
    '2026-04-11',
    31,
    14,
    2367750.0,
    2367750.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000033'::uuid,
    '2919836',
    'FVS-72843',
    'HERNANDEZ CRUZ YEIDY ALEJANDRA SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    191050.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000034'::uuid,
    '2919844',
    'FVS-72845',
    'NC GRAPHICS S.A.S. SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    178200.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000003'::uuid,
    '2919881',
    'FVS-72851',
    'PLANETA GRAFICO SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -124600.0,
    -124600.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000038'::uuid,
    '2920063',
    'FVS-72862',
    'MUISCAS PUBLICIDAD S.A.S SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -201150.0,
    -201150.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000049'::uuid,
    '2920073',
    'FVS-72865',
    'MATICES COMUNICACION VISUAL SAS SERVICIO',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    182350.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000012'::uuid,
    '2920082',
    'FVS-72868',
    'SANABRIA FRANKY MARIA ANGELICA SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -204050.0,
    -204050.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000006'::uuid,
    '2920088',
    'FVS-72871',
    'PRODUCTOR DE HERRAJES COLOMBIANOS SERVIC',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -47800.0,
    -47800.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000046'::uuid,
    '2920093',
    'FVS-72873',
    'IN - DESIGN SAS SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    120100.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000011'::uuid,
    '2920106',
    'FVS-72877',
    'ACRIGROUP DISEÑO Y PUBLICIDAD SAS SERVIC',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -233000.0,
    -233000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000054'::uuid,
    '2920120',
    'FVS-72882',
    'RODRIGUEZ MURILLO JAVIER SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    210800.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000048'::uuid,
    '2920135',
    'FVS-72888',
    'DISEÑOS Y SELLADOS BASTIDAS SAS SERVICI',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    10,
    4,
    -24000.0,
    -24000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000043'::uuid,
    '2920138',
    'FVS-72889',
    'ANZOLA LOYO ANYERBERT ARTURO SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    251900.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000031'::uuid,
    '2920149',
    'FVS-72893',
    'REBELARTE COMUNICACION VISUAL SAS SERVIC',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -206000.0,
    -206000.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000026'::uuid,
    '2920156',
    'FVS-72896',
    'RINCON PINZON MARGIE KATHERINE SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    98150.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000052'::uuid,
    '2920165',
    'FVS-72899',
    'MORALES CLAVIJO JUAN FELIPE SERVICIOS P',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -159150.0,
    -159150.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000039'::uuid,
    '2920244',
    'FVS-72923',
    'POP PUBLICIDAD & PROMOCIONALES SAS SERVI',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    10,
    4,
    -106100.0,
    -106100.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000042'::uuid,
    '2920255',
    'FVS-72928',
    'ARRIERO LUNA ANDRES ESNEIDER SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-11',
    31,
    4,
    -183750.0,
    -183750.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000027'::uuid,
    '2920277',
    'FVS-72935',
    'PATARROYO PAEZ ADRIANA YAZMIN SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    140050.0,
    0.0
);

INSERT INTO cartera (company_id, tenant_id, siesa_row_id, siesa_factura, siesa_sucursal, observacion,
    fecha_factura, fecha_pronto_pago, fecha_vence, dias_mora, dias_financia, saldo, valor_vencido)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '10000000-0000-0000-0000-000000000009'::uuid,
    '2920308',
    'FVS-72944',
    'ALARCON PIRACHICAN JOHN FREDDY SERVICIOS',
    '',
    '2026-04-11',
    '2026-04-11',
    '2026-04-21',
    31,
    4,
    85200.0,
    0.0
);


-- =============================================================================
-- 7. FINANCIAL RULES — Global parameters
-- =============================================================================

INSERT INTO financial_rules (company_id, rule_key, rule_value, description) VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 'pp_window_days', 10, 'Pronto pago: 10 days from invoice date'),
('00000000-0000-0000-0000-000000000001'::uuid, 'interes_mora_diario', 0.000667, 'Daily late-interest rate (~2% monthly / 24% annual)'),
('00000000-0000-0000-0000-000000000001'::uuid, 'grace_period_days', 0, 'Default grace period before interest accrual starts'),
('00000000-0000-0000-0000-000000000001'::uuid, 'iva_rate', 0.19, 'IVA rate 19%'),
('00000000-0000-0000-0000-000000000001'::uuid, 'ipc_increment_pct', 5.1, 'IPC annual increment 2026 (5.1%)');


-- =============================================================================
-- 8. GASTO TYPES — Shared expense categories (from C-KREA GB 4. GASTOS)
-- =============================================================================

INSERT INTO gasto_types (company_id, category, name, description, allocation_method, siesa_cuenta) VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 'servicios_publicos', 'Acueducto',           'Water service — $29,947/local', 'pro_rata', NULL),
('00000000-0000-0000-0000-000000000001'::uuid, 'servicios_publicos', 'Plan Celular',         'Cell phone plan', 'fixed', NULL),
('00000000-0000-0000-0000-000000000001'::uuid, 'servicios_publicos', 'Energía Arrendatarios','Electricity billed to tenants (metered)', 'metered', NULL),
('00000000-0000-0000-0000-000000000001'::uuid, 'servicios_publicos', 'Energía Zonas Comunes','Common-area electricity', 'pro_rata', NULL),
('00000000-0000-0000-0000-000000000001'::uuid, 'aseo_cafeteria',     'Aseo y Cafetería',     'Cleaning & cafeteria services', 'pro_rata', NULL),
('00000000-0000-0000-0000-000000000001'::uuid, 'vigilancia',         'T-Protec Vigilancia',  'Security services', 'pro_rata', NULL),
('00000000-0000-0000-0000-000000000001'::uuid, 'nomina',             'Nómina Administración','Admin payroll (4 employees)', 'pro_rata', NULL),
('00000000-0000-0000-0000-000000000001'::uuid, 'publicidad',         'Publicidad',           'Advertising & marketing', 'pro_rata', NULL),
('00000000-0000-0000-0000-000000000001'::uuid, 'reparaciones',       'Reparaciones',         'Repairs & maintenance', 'pro_rata', NULL),
('00000000-0000-0000-0000-000000000001'::uuid, 'impuestos',          'Impuesto Predial',     'Property tax', 'fixed', NULL),
('00000000-0000-0000-0000-000000000001'::uuid, 'otros',              'Otros Gastos',         'Miscellaneous (HSE, Datacredito, andamios, etc.)', 'pro_rata', NULL);

-- =============================================================================
-- 9. GASTOS — Monthly totals (January 2026 sample from GASTOS sheet)
-- =============================================================================

INSERT INTO gastos (company_id, gasto_type_id, periodo, total_amount, description) VALUES
('00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM gasto_types WHERE name='Acueducto' LIMIT 1),            '202601', 2515521, 'Enero 2026 — $29,947/local'),
('00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM gasto_types WHERE name='Plan Celular' LIMIT 1),         '202601', 45916, 'Enero 2026'),
('00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM gasto_types WHERE name='Energía Arrendatarios' LIMIT 1),'202601', 12683800, 'Enero 2026 — metered per tenant'),
('00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM gasto_types WHERE name='Energía Zonas Comunes' LIMIT 1),'202601', 7938781, 'Enero 2026 — common areas'),
('00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM gasto_types WHERE name='Aseo y Cafetería' LIMIT 1),     '202601', 3722463, 'Enero 2026'),
('00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM gasto_types WHERE name='T-Protec Vigilancia' LIMIT 1),  '202601', 10178040, 'Enero 2026'),
('00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM gasto_types WHERE name='Nómina Administración' LIMIT 1),'202601', 18618000, 'Enero 2026 — 4 employees'),
('00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM gasto_types WHERE name='Publicidad' LIMIT 1),           '202601', 466620, 'Enero 2026'),
('00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM gasto_types WHERE name='Otros Gastos' LIMIT 1),         '202601', 13651687, 'Enero 2026 — HSE, Datacredito, andamios, etc.');


COMMIT;

-- =============================================================================
-- SUMMARY
-- =============================================================================
-- Company:      1 (Central Kreativa)

-- Tenants:      59 (unique by NIT)
-- Units:        85 (84 occupied + 1 disponible)
-- Contracts:    78
-- Projections:  1008 (84 units × 12 months)
-- Cartera:      250 receivable records
-- Fin. Rules:   5 global parameters
-- Gasto Types:  11 categories
-- Gastos:       9 monthly records (Jan 2026 sample)