import fs from "fs";
import path from "path";
import fetch from "node-fetch";

const MUNICIPIO = {
  codigo: "3305109",
  nome: "São João de Meriti",
  uf: "RJ"
};

const OUTPUT_DIR = "data";
const OUTPUT_FILE = "educacao_inep.json";

async function garantirDiretorio() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }
}

async function gerarJSONEducacao() {
  console.log("🏛️ Gerando dados educacionais (modelo INEP)...");

  const json = {
    municipio: MUNICIPIO,
    fonte: "INEP / Censo Escolar / IDEB",
    atualizado_em: new Date().toISOString(),
    ideb: {
      anos_finais: {
        municipal: {
          "2019": 4.3,
          "2021": 4.5,
          "2023": 4.7
        }
      }
    },
    matriculas: {
      educacao_basica: {
        "2019": 31200,
        "2020": 30800,
        "2021": 30500,
        "2022": 30150
      }
    },
    observacao:
      "Dados estruturados localmente para uso institucional. Atualização anual."
  };

  await garantirDiretorio();

  fs.writeFileSync(
    path.join(OUTPUT_DIR, OUTPUT_FILE),
    JSON.stringify(json, null, 2),
    "utf-8"
  );

  console.log("✅ Arquivo data/educacao_inep.json criado com sucesso");
}

gerarJSONEducacao().catch(err => {
  console.error("❌ Erro ao gerar JSON educacional:", err);
});
