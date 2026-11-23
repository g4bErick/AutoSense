SELECT u.id, u.nome, u.email, u.perfil, v.modelo, v.placa 
FROM usuarios u 
LEFT JOIN veiculos v ON u.id = v.usuario_id;