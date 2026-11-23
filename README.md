# 🚗 AutoSense — Diagnóstico Veicular Inteligente & Manutenção Preventiva

> Plataforma web de diagnóstico veicular **OBD-II** e controle de manutenção preventiva desenvolvida para **motoristas leigos**, traduzindo códigos de falha técnicos (DTC) e dados de telemetria em orientações claras, acessíveis e acionáveis.

![License](https://img.shields.io/badge/license-MIT-green)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs)
![MySQL](https://img.shields.io/badge/Database-MySQL-4479A1?logo=mysql)
![Status](https://img.shields.io/badge/Release-v1.0.0--demo-blue)

---

## 🎯 Sobre o Projeto

A maioria dos motoristas desconhece o significado das luzes de alerta do painel ou dos códigos técnicos gerados pela central eletrônica do veículo (ECU), o que gera insegurança, atrasos na manutenção preventiva e vulnerabilidade a diagnósticos imprecisos.

O **AutoSense** resolve esse problema conectando um adaptador automotivo **OBD-II (ELM327)** de baixo custo a uma interface web intuitiva que:
- **Traduz códigos de falha (DTC):** Converte códigos técnicos (ex.: `P0300`, `P0171`) em explicações simples sobre a gravidade e o que fazer.
- **Monitora telemetria em tempo real:** Exibe rotação do motor (RPM), temperatura do líquido de arrefecimento, tensão da bateria e velocidade.
- **Controla revisões preventivas:** Alerta sobre prazos e quilometragem de troca de óleo, filtros, freios e pneus.
- **Prioriza a acessibilidade:** Conta com modo de alto contraste (`accessibility.css`) e leitura por voz integrada via *Web Speech API*.
- **Aciona suporte rápido (SOS):** Disponibiliza botão de emergência com envio rápido de localização e status do veículo.

> **Nota sobre a versão atual (`v1.0.0`):** Esta release utiliza dados simulados inseridos manualmente no banco MySQL para demonstrar a arquitetura completa e o fluxo funcional do sistema durante a apresentação acadêmica.

---

## 🛠️ Tecnologias Utilizadas

- **Front-end:** HTML5, CSS3 (`style.css` e `accessibility.css`), JavaScript (ES6+) e HTML5 Canvas
- **Back-end:** Node.js com Express (`server.js`)
- **Banco de Dados:** MySQL (`autosense`)
- **Hardware / Protocolo:** Padrão automotivo OBD-II (interface ELM327)
- **Automação Local:** Scripts de inicialização rápida para Windows (`iniciar.bat` e `server.ps1`)

---

## 📂 Estrutura do Repositório

```text
AutoSense/
├── database/                                           # Scripts SQL (DDL, DML e consultas)
│   ├── Database AutoSense.sql                          # Estrutura completa do banco e tabelas
│   ├── Tabela Usuários, Veículos e Placas.sql          # Criação e consulta de entidades base
│   ├── Insert dos Usuários, Veículos e Dispositivos.sql # Carga inicial de cadastros
│   ├── Insert Leituras e Alertas.sql                   # Carga de telemetria e alertas DTC
│   └── Filtro de Alertas.sql                           # Consultas filtradas por severidade
├── js/                                                 # Scripts de telemetria, painel e acessibilidade
├── index.html                                          # Interface principal do painel AutoSense
├── style.css                                           # Estilização principal responsiva
├── accessibility.css                                   # Modo de alto contraste e acessibilidade
├── server.js                                           # Servidor web e API REST em Node.js
├── iniciar.bat                                         # Atalho de inicialização rápida (Windows)
├── server.ps1                                          # Script PowerShell de execução do ambiente
├── package.json                                        # Dependências e metadados do projeto
└── LICENSE                                             # Licença MIT
