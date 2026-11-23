USE autosense;
INSERT INTO usuarios (id, nome, email, senha_hash, perfil) VALUES
(1, 'Administrador do Sistema', 'admin@autosense.com', 'hash_admin_123', 'ADMIN'),
(2, 'Sr. João da Silva', 'seu.joao@autosense.com', 'hash_joao_123', 'USER'),
(3, 'Mariana Oliveira', 'mariana@autosense.com', 'hash_mariana_123', 'USER'),
(4, 'Dona Maria Helena', 'dona.maria@autosense.com', 'hash_maria_123', 'USER')
AS new
ON DUPLICATE KEY UPDATE 
    nome = new.nome, 
    email = new.email, 
    perfil = new.perfil;

INSERT INTO veiculos (usuario_id, placa, modelo, marca, ano) VALUES
(2, 'BRA2E19', 'Corolla XEi 2.0', 'Toyota', 2020),
(3, 'RIO4A22', 'Civic Touring 1.5 Turbo', 'Honda', 2021),
(4, 'BHZ8J90', 'Onix Plus Premier 1.0 Turbo', 'Chevrolet', 2022)
AS new
ON DUPLICATE KEY UPDATE 
    modelo = new.modelo, 
    marca = new.marca;

INSERT INTO dispositivos_obd (veiculo_id, codigo_mac, status_conexao) VALUES
(1, '00:1A:2B:3C:4D:01', 'CONNECTED'),
(2, '00:1A:2B:3C:4D:02', 'CONNECTED'),
(3, '00:1A:2B:3C:4D:03', 'CONNECTED')
AS new
ON DUPLICATE KEY UPDATE 
    status_conexao = new.status_conexao;