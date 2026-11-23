USE autosense;
-- Leituras com as Falhas OBD-II
INSERT INTO leituras_telemetria (dispositivo_id, rpm, velocidade, temp_liquido_arrefecimento, nivel_combustivel, voltagem_bateria, dtc_codigos)
VALUES 
-- Sr. João da Silva (Dispositivo 1) - Falha P0115
(1, 1800, 50, 115, 60.00, 13.80, '["P0115"]'),
-- Dona Maria Helena (Dispositivo 3) - Falha P0300
(3, 2200, 0, 90, 85.00, 14.10, '["P0300"]');

-- ALERTAS
INSERT INTO alertas_sos (veiculo_id, tipo_alerta, descricao, status)
VALUES 
(1, 'FALHA_TEMPERATURA', 'Código P0115: Falha no circuito de temperatura do motor', 'PENDING'),
(3, 'FALHA_IGNICAO', 'Código P0300: Falha múltipla de ignição (Misfire)', 'PENDING');