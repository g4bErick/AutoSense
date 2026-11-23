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

## 📖 Tutorial: Como Baixar e Rodar o Projeto no Seu Computador

Siga os passos abaixo para testar o **AutoSense** localmente:

### 1. O que você precisa ter instalado (Pré-requisitos)
- **Node.js** (versão 18 ou superior) — [Baixar aqui](https://nodejs.org/)
- **MySQL** (MySQL Server, MySQL Workbench ou XAMPP) — [Baixar aqui](https://dev.mysql.com/downloads/)

---

### 2. Baixar os arquivos do projeto
Você pode baixar de duas formas:
- **Pelo navegador (mais simples):** Clique no botão verde **`<> Code`** no topo desta página e selecione **`Download ZIP`**. Depois, extraia a pasta no seu computador.
- **Pelo terminal (Git):**
  ```bash
  git clone [https://github.com/g4bErick/AutoSense.git](https://github.com/g4bErick/AutoSense.git)
  cd AutoSense
