USE autosense;

SELECT DISTINCT
    v.id AS veiculo_id,
    u.nome AS proprietario,
    v.marca,
    v.modelo,
    v.placa,
    lt.dtc_codigos AS falha_obd,
    a.tipo_alerta AS alerta_sos,
    a.status AS status_alerta
FROM veiculos v
INNER JOIN usuarios u ON v.usuario_id = u.id
LEFT JOIN dispositivos_obd d ON v.id = d.veiculo_id
LEFT JOIN leituras_telemetria lt ON d.id = lt.dispositivo_id
LEFT JOIN alertas_sos a ON v.id = a.veiculo_id
WHERE 
    (lt.dtc_codigos IS NOT NULL AND lt.dtc_codigos != '[]' AND lt.dtc_codigos != 'Nenhuma')
    OR 
    (a.status = 'PENDING');