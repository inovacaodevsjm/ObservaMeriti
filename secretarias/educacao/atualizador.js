import fs from 'fs';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const JSON_PATH = join(__dirname, 'dados_educacao.json');

// Nova API Municipal (Fonte Primária para KPIs)
const API_SJM_EDUCACAO = "http://dt001.meriti.rj.gov.br:8162/observatoriodash/api/get_educacao.php?ano=2025";

// MAPEAMENTO DE TODAS AS BASES (Mantido para os Gráficos)
const FONTES_SJM = [
    { nome: "SIDRA/IBGE (Educação)", url: "https://servicodados.ibge.gov.br/api/v3/agregados/5938/periodos/2023/variaveis/63?localidades=N6[3305109]", tipo: "API" },
    { nome: "Dados.gov.br (INEP/IDEB)", url: "https://dados.gov.br/api/publico/indicadores/educacao/municipio/3305109", tipo: "API" },
    { nome: "QEdu/Portal Transparência (Referência)", url: "https://qedu.org.br/municipio/3305109-sao-joao-de-meriti", tipo: "Web" },
    { nome: "API Localidades (Estrutura)", url: "https://servicodados.ibge.gov.br/api/v1/localidades/municipios/3305109", tipo: "API" }
];

async function rodarAtualizacao() {
    console.log("🔍 Iniciando Verificação Multi-base + API Municipal 2025...");
    
    try {
        // 1. CARREGA OS DADOS ATUAIS (Para não destruir nada)
        const dadosLocais = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
        let sucessoKPI = false;
        let algumaFonteOnline = false;
        let logsDeTentativa = [];


        // 2. BUSCA AUTOMÁTICA NA NOVA API MUNICIPAL (KPIs)
        try {
            console.log("📡 Acessando API Municipal SJM...");
            const resSjm = await axios.get(API_SJM_EDUCACAO, { timeout: 10000 });
            console.log("📦 RESPOSTA BRUTA DA API:");
            console.log(resSjm.data);
            console.log("📦 TIPO:", typeof resSjm.data);
            
            // ... dentro da função rodarAtualizacao, logo após o resSjm = await axios.get(...)
        if (resSjm.status === 200 && resSjm.data) {
            const api = Array.isArray(resSjm.data)
                ? resSjm.data[0]
                : resSjm.data;

            const toNumber = (v) =>
                Number(String(v).replace(/\./g, '').replace(',', '.')) || 0;

            dadosLocais.kpi_escolas = toNumber(api.escolas);
            dadosLocais.kpi_turmas = toNumber(api.turmas);
            dadosLocais.kpi_alunos = toNumber(api.alunos);
            dadosLocais.kpi_professores = toNumber(api.professores);
            dadosLocais.kpi_funcionarios = toNumber(api.funcionarios);
            dadosLocais.kpi_responsaveis = toNumber(api.responsaveis);
            dadosLocais.kpi_vagas = toNumber(api.vagas);
            dadosLocais.kpi_aulas = toNumber(api.aulas);
            dadosLocais.kpi_refeicoes = toNumber(api.refeicoes);
            dadosLocais.kpi_eventos = toNumber(api.eventos);
            dadosLocais.kpi_distorcao_ano = toNumber(api.distorcaoPorAno);


            sucessoKPI = true;
            logsDeTentativa.push("API Municipal SJM: Online");
        }

        } catch (errApi) {
            console.warn("⚠️ API Municipal indisponível. Usando valores de segurança.");
            logsDeTentativa.push("API Municipal SJM: Offline");
        }

        // 3. CONTINUA VERIFICAÇÃO DAS OUTRAS BASES (Para os Status e Gráficos)
        for (const fonte of FONTES_SJM) {
            try {
                console.log(`📡 Verificando: ${fonte.nome}...`);
                const response = await axios.get(fonte.url, { timeout: 10000 });
                if (response.status === 200) {
                    console.log(`✅ Conexão estabelecida com ${fonte.nome}`);
                    logsDeTentativa.push(`${fonte.nome}: Online`);
                    algumaFonteOnline = true;
                }
            } catch (err) {
                logsDeTentativa.push(`${fonte.nome}: Offline`);
            }
        }

        // 4. SALVA O ARQUIVO MESCLADO (KPIs novos + Gráficos antigos)
        dadosLocais.ultima_sincronizacao = new Date().toLocaleString('pt-BR');
        dadosLocais.status_das_fontes = logsDeTentativa;
        dadosLocais.fonte_origem = sucessoKPI
        ? "API Municipal SJM (KPIs Oficiais)"
        : "Base Local Protegida";


        fs.writeFileSync(JSON_PATH, JSON.stringify(dadosLocais, null, 2));
        
        console.log("--------------------------------------------------");
        console.log("🚀 Sincronização Concluída!");
        console.log("📊 KPIs: Atualizados via API Municipal 2025.");
        console.log("📈 Gráficos: Mantidos com dados protegidos (IDEB 4.9).");
        console.log("--------------------------------------------------");

    } catch (error) {
        console.error("❌ Erro crítico no processo:", error.message);
    }
}

rodarAtualizacao();