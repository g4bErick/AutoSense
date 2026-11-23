-- Banco de Dados
CREATE DATABASE IF NOT EXISTS autosense;
USE autosense;

-- 2. Limpar tabelas antigas caso existam (na ordem correta por conta das FKs)
DROP TABLE IF EXISTS alertas_sos;
DROP TABLE IF EXISTS leituras_telemetria;
DROP TABLE IF EXISTS dispositivos_obd;
DROP TABLE IF EXISTS veiculos;
DROP TABLE IF EXISTS usuarios;

-- Usuários
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil ENUM('ADMIN', 'USER') DEFAULT 'USER',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Veículos
CREATE TABLE veiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    placa VARCHAR(10) UNIQUE NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    marca VARCHAR(50) NOT NULL,
    ano INT CHECK (ano > 1900),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Dispositivos OBD-II
CREATE TABLE dispositivos_obd (
    id INT AUTO_INCREMENT PRIMARY KEY,
    veiculo_id INT UNIQUE,
    codigo_mac VARCHAR(17) UNIQUE NOT NULL,
    status_conexao ENUM('CONNECTED', 'CONNECTING', 'DISCONNECTED') DEFAULT 'DISCONNECTED',
    ultima_conexao TIMESTAMP NULL,
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE
);

-- Telemetria e Diagnóstico OBD-II
CREATE TABLE leituras_telemetria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id INT NOT NULL,
    rpm INT,
    velocidade INT,
    temp_liquido_arrefecimento INT,
    nivel_combustivel DECIMAL(5,2),
    voltagem_bateria DECIMAL(4,2),
    dtc_codigos JSON,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_obd(id) ON DELETE CASCADE,
    INDEX idx_telemetria_dispositivo_data (dispositivo_id, data_hora DESC)
);

-- Alertas SOS
CREATE TABLE alertas_sos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    veiculo_id INT NOT NULL,
    tipo_alerta VARCHAR(50) NOT NULL,
    descricao TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status ENUM('PENDING', 'IN_PROGRESS', 'RESOLVED') DEFAULT 'PENDING',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE
);-- 1. Criar e selecionar o banco (sem apagar dados existentes)
CREATE DATABASE IF NOT EXISTS autosense;
USE autosense;

-- 2. Criar tabelas apenas se ainda não existirem
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil ENUM('ADMIN', 'USER') DEFAULT 'USER',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS veiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    placa VARCHAR(10) UNIQUE NOT NULL,
    modelo VARCHAR(50) NOT NULL,
    marca VARCHAR(50) NOT NULL,
    ano INT CHECK (ano > 1900),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dispositivos_obd (
    id INT AUTO_INCREMENT PRIMARY KEY,
    veiculo_id INT UNIQUE,
    codigo_mac VARCHAR(17) UNIQUE NOT NULL,
    status_conexao ENUM('CONNECTED', 'CONNECTING', 'DISCONNECTED') DEFAULT 'DISCONNECTED',
    ultima_conexao TIMESTAMP NULL,
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leituras_telemetria (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    dispositivo_id INT NOT NULL,
    rpm INT,
    velocidade INT,
    temp_liquido_arrefecimento INT,
    nivel_combustivel DECIMAL(5,2),
    voltagem_bateria DECIMAL(4,2),
    dtc_codigos JSON,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos_obd(id) ON DELETE CASCADE,
    INDEX idx_telemetria_dispositivo_data (dispositivo_id, data_hora DESC)
);

CREATE TABLE IF NOT EXISTS alertas_sos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    veiculo_id INT NOT NULL,
    tipo_alerta VARCHAR(50) NOT NULL,
    descricao TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status ENUM('PENDING', 'IN_PROGRESS', 'RESOLVED') DEFAULT 'PENDING',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE
);

-- 3. Inserir dados iniciais sem duplicar nem apagar cadastros novos
INSERT IGNORE INTO usuarios (id, nome, email, senha_hash, perfil) VALUES
(1, 'Administrador do Sistema', 'admin@autosense.com', 'admin', 'ADMIN'),
(2, 'Sr. João da Silva', 'seu.joao@autosense.com', '123', 'USER'),
(3, 'Mariana Oliveira', 'mariana@autosense.com', '123', 'USER'),
(4, 'Dona Maria Helena', 'dona.maria@autosense.com', '123', 'USER');

INSERT IGNORE INTO veiculos (id, usuario_id, placa, modelo, marca, ano) VALUES
(1, 2, 'BRA2E19', 'Corolla XEi 2.0', 'Toyota', 2021),
(2, 3, 'RIO4A22', 'Civic Touring 1.5 Turbo', 'Honda', 2022),
(3, 4, 'BHZ8J90', 'Onix Plus Premier 1.0 Turbo', 'Chevrolet', 2023);

INSERT IGNORE INTO dispositivos_obd (id, veiculo_id, codigo_mac, status_conexao) VALUES
(1, 1, '00:1A:2B:3C:4D:01', 'CONNECTED'),
(2, 2, '00:1A:2B:3C:4D:02', 'CONNECTED'),
(3, 3, '00:1A:2B:3C:4D:03', 'CONNECTED');

INSERT IGNORE INTO leituras_telemetria (id, dispositivo_id, rpm, velocidade, temp_liquido_arrefecimento, nivel_combustivel, voltagem_bateria, dtc_codigos) VALUES 
(1, 1, 1800, 50, 115, 60.00, 13.80, '["P0115"]'),
(2, 2, 2000, 70, 88, 90.00, 14.00, '[]'),
(3, 3, 2200, 0, 90, 85.00, 14.10, '["P0300"]');

INSERT IGNORE INTO alertas_sos (id, veiculo_id, tipo_alerta, descricao, status) VALUES 
(1, 1, 'FALHA_TEMPERATURA', 'Código P0115: Falha no circuito de temperatura do motor', 'PENDING'),
(2, 3, 'FALHA_IGNICAO', 'Código P0300: Falha múltipla de ignição (Misfire)', 'PENDING');

-- 4. Exibir os usuários gravados para confirmar
SELECT * FROM usuarios;