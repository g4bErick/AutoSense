const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '123456', // <-- COLOQUE SUA SENHA DO MYSQL AQUI
    database: 'autosense',
    port: 3306
});

// Testa a conexão assim que o servidor liga
pool.getConnection()
    .then(conn => {
        console.log('Conectado com sucesso ao banco MySQL (autosense)!');
        conn.release();
    })
    .catch(err => {
        console.error('ERRO AO CONECTAR NO MYSQL:', err.message);
    });

// 1. Carregar todos os dados do MySQL para o site
app.get('/api/sync', async (req, res) => {
    try {
        const [users] = await pool.query('SELECT * FROM usuarios ORDER BY id ASC');
        const [vehicles] = await pool.query(`
            SELECT v.*, 
                   (SELECT dtc_codigos FROM leituras_telemetria lt 
                    JOIN dispositivos_obd d ON lt.dispositivo_id = d.id 
                    WHERE d.veiculo_id = v.id ORDER BY lt.id DESC LIMIT 1) AS dtc_codigos
            FROM veiculos v
        `);
        res.json({ users, vehicles });
    } catch (err) {
        console.error('Erro na rota /api/sync:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 2. Criar novo Usuário (e veículo, se houver)
app.post('/api/users', async (req, res) => {
    const { name, email, password, role, vehicle } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)',
            [name, email, password || '123', role === 'admin' ? 'ADMIN' : 'USER']
        );
        const newUserId = result.insertId;

        if (vehicle) {
            const [vehRes] = await pool.query(
                'INSERT INTO veiculos (usuario_id, placa, modelo, marca, ano) VALUES (?, ?, ?, ?, ?)',
                [newUserId, vehicle.plate.toUpperCase(), vehicle.model, vehicle.make, vehicle.year]
            );
            await pool.query(
                'INSERT INTO dispositivos_obd (veiculo_id, codigo_mac, status_conexao) VALUES (?, ?, ?)',
                [vehRes.insertId, '00:1A:2B:3C:4D:' + vehRes.insertId, 'CONNECTED']
            );
        }
        res.json({ success: true, id: newUserId });
    } catch (err) {
        console.error('Erro ao criar usuário:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 3. Excluir Usuário pelo e-mail
app.delete('/api/users/:email', async (req, res) => {
    try {
        await pool.query('DELETE FROM usuarios WHERE email = ?', [req.params.email]);
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao excluir usuário:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 4. Atualizar Falhas OBD (DTC) de um veículo pela placa
app.put('/api/vehicles/:plate/dtc', async (req, res) => {
    const { codes } = req.body;
    try {
        const [vehs] = await pool.query('SELECT id FROM veiculos WHERE placa = ?', [req.params.plate]);
        if (vehs.length > 0) {
            const veiculoId = vehs[0].id;
            const [disps] = await pool.query('SELECT id FROM dispositivos_obd WHERE veiculo_id = ?', [veiculoId]);
            if (disps.length > 0) {
                await pool.query(
                    'INSERT INTO leituras_telemetria (dispositivo_id, rpm, velocidade, temp_liquido_arrefecimento, nivel_combustivel, voltagem_bateria, dtc_codigos) VALUES (?, 0, 0, 90, 80, 12.6, ?)',
                    [disps[0].id, JSON.stringify(codes)]
                );
            }
            if (codes.length === 0) {
                await pool.query("UPDATE alertas_sos SET status = 'RESOLVED' WHERE veiculo_id = ?", [veiculoId]);
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao atualizar DTC:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(3001, () => {
    console.log('API AutoSense rodando na porta 3001');
});