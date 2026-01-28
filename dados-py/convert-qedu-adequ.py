import time
import re
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup

# --- CONFIGURAÇÃO ---
URL_BASE = "https://qedu.org.br/municipio/3305109-sao-joao-de-meriti/aprendizado"
ARQUIVO_SAIDA = r"C:\Users\user\Desktop\Observatório de Dados\dados-py\Dados_QEdu_SJM_Historico.xlsx"

# Lista de anos do SAEB para buscar
ANOS_SAEB = ["2023", "2021", "2019", "2017", "2015"]

def configurar_driver():
    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--ignore-certificate-errors")
    return webdriver.Chrome(options=options)

def forcar_clique(driver, texto_alvo, tentar_scroll=True):
    """
    Tenta clicar em um elemento pelo texto.
    Retorna True se clicou, False se não achou.
    """
    try:
        # XPath busca qualquer elemento que contenha o texto
        xpath = f"//*[contains(text(), '{texto_alvo}')]"
        
        # Espera curta para verificar existência
        elemento = WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.XPATH, xpath))
        )
        
        if tentar_scroll:
            driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", elemento)
            time.sleep(1)
        
        # Tenta clique normal e fallback para JS
        try:
            elemento.click()
        except:
            driver.execute_script("arguments[0].click();", elemento)
            
        time.sleep(4) # Espera o site atualizar os dados
        return True
    except:
        return False

def extrair_dados_da_tela(driver, ano_saeb, etapa_nome, ano_escolar, disciplina):
    """
    Lê o HTML atual e extrai os números usando Regex
    """
    dados_list = []
    
    # Pega o HTML da página
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    texto_pagina = soup.get_text(separator=" ", strip=True)
    
    # --- 1. APRENDIZADO ADEQUADO (Valor Destaque) ---
    match_adequado = re.search(r'(\d+)\s*%\s*dos alunos têm aprendizado adequado', texto_pagina, re.IGNORECASE)
    if not match_adequado:
        # Tenta padrão inverso
        match_adequado = re.search(r'aprendizado adequado.*?(\d+)\s*%', texto_pagina, re.IGNORECASE)
    
    valor_adequado = match_adequado.group(1) if match_adequado else None
    
    # Se não achou via Regex, tenta CSS genérico de destaque (KPIs)
    if not valor_adequado:
        destaques = soup.select(".amount, .value, .kpi-value")
        for d in destaques:
            txt = d.get_text(strip=True)
            if "%" in txt and len(txt) < 8:
                valor_adequado = txt.replace('%', '').replace(',', '.').strip()
                break

    if valor_adequado:
        dados_list.append({
            "Ano Calendário": ano_saeb,
            "Etapa de Ensino": etapa_nome,      # Ex: Anos Iniciais
            "Ano Escolar": ano_escolar,         # Ex: 5º ano
            "Disciplina": disciplina,
            "Indicador": "Aprendizado Adequado",
            "Valor": valor_adequado,
            "Unidade": "%"
        })
        print(f"      -> {ano_saeb} | {ano_escolar} | {disciplina}: {valor_adequado}% (Adequado)")

    # --- 2. NÍVEIS DE PROFICIÊNCIA (Insuficiente, Básico...) ---
    niveis = ["Insuficiente", "Básico", "Proficiente", "Avançado"]
    elementos_barra = soup.select("div[class*='bar'], div[class*='progress'], li, tr")
    
    for el in elementos_barra:
        texto_el = el.get_text(separator=" ", strip=True)
        for nivel in niveis:
            if nivel in texto_el:
                # Procura número % próximo ao nome do nível
                # Regex procura: "Insuficiente ... 45%"
                match_nivel = re.search(rf'{nivel}.*?(\d+)\s*%', texto_el, re.IGNORECASE)
                if not match_nivel:
                     match_nivel = re.search(rf'(\d+)\s*%.*?{nivel}', texto_el, re.IGNORECASE)
                
                if match_nivel:
                    dados_list.append({
                        "Ano Calendário": ano_saeb,
                        "Etapa de Ensino": etapa_nome,
                        "Ano Escolar": ano_escolar,
                        "Disciplina": disciplina,
                        "Indicador": f"Nível - {nivel}",
                        "Valor": match_nivel.group(1),
                        "Unidade": "%"
                    })

    return dados_list

def main():
    driver = configurar_driver()
    todos_dados = []

    try:
        print("🚀 Iniciando extração histórica QEdu...")
        driver.get(URL_BASE)
        time.sleep(8) # Carregamento inicial

        # Dicionário de Etapas para iterar
        # Estrutura: { "Texto do Botão": ("Nome da Etapa", "Nome do Ano") }
        mapa_anos_escolares = {
            "5º ano": ("Anos Iniciais", "5º ano"),
            "9º ano": ("Anos Finais", "9º ano")
        }
        
        disciplinas = ["Língua Portuguesa", "Matemática"]

        # --- LOOP 1: ANOS DE CALENDÁRIO (2023, 2021...) ---
        for ano_saeb in ANOS_SAEB:
            print(f"\n📅 TENTANDO SELECIONAR ANO: {ano_saeb}...")
            
            # Tenta clicar no ano. Se não conseguir, assume que não tem dados ou botão não existe
            if not forcar_clique(driver, ano_saeb):
                print(f"⚠️ Botão do ano {ano_saeb} não encontrado ou não clicável. Pulando.")
                continue
            
            # --- LOOP 2: ETAPA ESCOLAR (5º ano / 9º ano) ---
            for botao_ano_escolar, (nome_etapa, nome_ano_escolar) in mapa_anos_escolares.items():
                if not forcar_clique(driver, botao_ano_escolar):
                    print(f"   ⚠️ Não consegui entrar em {botao_ano_escolar}")
                    continue
                
                # --- LOOP 3: DISCIPLINA ---
                for disc in disciplinas:
                    # Tenta clicar na disciplina
                    # Obs: as vezes o site reseta para uma disciplina padrão ao mudar de ano, 
                    # então sempre forçamos o clique.
                    clicou_disc = forcar_clique(driver, disc)
                    if not clicou_disc and disc == "Língua Portuguesa":
                        clicou_disc = forcar_clique(driver, "Português") # Tentativa alternativa
                    
                    if clicou_disc:
                        # EXTRAIR DADOS
                        novos_dados = extrair_dados_da_tela(driver, ano_saeb, nome_etapa, nome_ano_escolar, disc)
                        todos_dados.extend(novos_dados)
                    else:
                        print(f"   ⚠️ Não consegui clicar em {disc}")

        # --- FIM E SALVAMENTO ---
        print("\n💾 Processando Excel...")
        df = pd.DataFrame(todos_dados)
        
        if df.empty:
            print("❌ Nenhum dado foi extraído. Verifique se o site abriu corretamente.")
        else:
            # Tratamento de dados numéricos
            df['Valor'] = pd.to_numeric(df['Valor'].str.replace(',', '.'), errors='coerce')
            
            # Remove duplicatas (caso o regex pegue o mesmo dado duas vezes)
            df = df.drop_duplicates()

            # Salva
            df.to_excel(ARQUIVO_SAIDA, index=False)
            print(f"✅ SUCESSO! Arquivo gerado com {len(df)} registros.")
            print(f"📂 Caminho: {ARQUIVO_SAIDA}")

    except Exception as e:
        print(f"❌ Erro fatal: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    main()