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
ARQUIVO_SAIDA = r"C:\Users\user\Desktop\Observatório de Dados\dados-py\Dados_QEdu_Proficiencia.xlsx"

# Anos do SAEB para buscar histórico
ANOS_SAEB = ["2023", "2021", "2019", "2017", "2015"]

def configurar_driver():
    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--ignore-certificate-errors")
    return webdriver.Chrome(options=options)

def forcar_clique(driver, texto_alvo):
    """
    Tenta encontrar o botão pelo texto e clicar.
    """
    try:
        # XPath busca qualquer elemento que contenha o texto exato
        xpath = f"//*[contains(text(), '{texto_alvo}')]"
        elemento = WebDriverWait(driver, 3).until(
            EC.presence_of_element_located((By.XPATH, xpath))
        )
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", elemento)
        time.sleep(0.5)
        driver.execute_script("arguments[0].click();", elemento)
        time.sleep(3) # Tempo para o gráfico atualizar
        return True
    except:
        return False

def extrair_proficiencia(driver, ano_saeb, etapa, disciplina):
    """
    Busca especificamente os dados de: Insuficiente, Básico, Proficiente e Avançado
    """
    dados = []
    
    # Pega o HTML limpo
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    
    # Níveis que queremos encontrar
    niveis_alvo = ["Insuficiente", "Básico", "Proficiente", "Avançado"]
    
    # Estratégia: O QEdu costuma colocar esses dados em listas (li) ou tabelas (tr)
    # Vamos pegar todos os textos que contenham essas palavras
    
    # 1. Busca blocos de texto que tenham nome do nível + porcentagem
    texto_pagina = soup.get_text(separator=" | ", strip=True)
    
    encontrou_algum = False
    
    for nivel in niveis_alvo:
        # Regex explicaçao:
        # Procura a palavra do nível (ex: Avançado)
        # Seguido de qualquer coisa (.*?) até achar um número (\d+) e um %
        # OU o inverso: Numero% ... Nivel
        
        padrao_1 = rf'{nivel}.*?(\d+)\s*%'
        padrao_2 = rf'(\d+)\s*%.*?{nivel}'
        
        valor = None
        
        # Tenta achar "Avançado ... 12%"
        match = re.search(padrao_1, texto_pagina, re.IGNORECASE)
        if match:
            valor = match.group(1)
        else:
            # Tenta achar "12% ... Avançado" (às vezes aparece assim na legenda)
            match = re.search(padrao_2, texto_pagina, re.IGNORECASE)
            if match:
                valor = match.group(1)
        
        if valor:
            encontrou_algum = True
            dados.append({
                "Ano Calendário": ano_saeb,
                "Etapa": etapa,
                "Disciplina": disciplina,
                "Nível de Proficiência": nivel,
                "Porcentagem": float(valor.replace(',', '.'))
            })
            print(f"      -> {nivel}: {valor}%")
            
    if not encontrou_algum:
        print("      ⚠️ Não achei dados de proficiência nesta tela.")
        
    return dados

def main():
    driver = configurar_driver()
    todos_dados = []

    try:
        print("🚀 Iniciando extração de PROFICIÊNCIA...")
        driver.get(URL_BASE)
        time.sleep(5)

        # Mapeamento
        mapa_etapas = {
            "5º ano": "Anos Iniciais (5º ano)",
            "9º ano": "Anos Finais (9º ano)"
        }
        disciplinas = ["Língua Portuguesa", "Matemática"]

        # --- LOOP PRINCIPAL ---
        for ano in ANOS_SAEB:
            print(f"\n📅 ANO: {ano}")
            if not forcar_clique(driver, ano):
                print(f"   (Pulei {ano} - botão não clicável)")
                continue
                
            for btn_etapa, nome_etapa in mapa_etapas.items():
                if not forcar_clique(driver, btn_etapa):
                    continue
                
                for disc in disciplinas:
                    # Tenta clicar na disciplina
                    if not forcar_clique(driver, disc):
                        # Tenta variação do nome se falhar
                        if disc == "Língua Portuguesa":
                            forcar_clique(driver, "Português")
                    
                    print(f"   🔍 Lendo: {nome_etapa} - {disc}...")
                    novos = extrair_proficiencia(driver, ano, nome_etapa, disc)
                    todos_dados.extend(novos)

        # SALVAR
        print("\n💾 Gerando Excel...")
        df = pd.DataFrame(todos_dados)
        
        if not df.empty:
            df.to_excel(ARQUIVO_SAIDA, index=False)
            print(f"✅ SUCESSO! Arquivo salvo em:\n{ARQUIVO_SAIDA}")
        else:
            print("❌ Nenhum dado encontrado.")

    except Exception as e:
        print(f"Erro: {e}")
    finally:
        driver.quit()

if __name__ == "__main__":
    main()