import time
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import Select

# --- CONFIGURAÇÃO ---
URL_BASE = "https://qedu.org.br/municipio/3305109-sao-joao-de-meriti/censo-escolar"
ARQUIVO_SAIDA = r"C:\Users\user\Desktop\Observatório de Dados\dados-py\Censo_Escolar_SJM_Filtros_Detalhados.xlsx"

# Lista de anos decrescente (2024 até 2010)
ANOS_BUSCA = [str(ano) for ano in range(2024, 2009, -1)]

# Filtros que serão aplicados no SELECT[4]
FILTROS_MODALIDADE = [
    "Com Ensino Infantil Regular",
    "Com Ensino Fundamental Regular"
]

def configurar_driver():
    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--ignore-certificate-errors")
    return webdriver.Chrome(options=options)

def selecionar_dropdown(driver, xpath, texto_visivel):
    """ Seleciona uma opção num dropdown pelo texto exato """
    try:
        wait = WebDriverWait(driver, 10)
        elemento = wait.until(EC.element_to_be_clickable((By.XPATH, xpath)))
        
        # Garante visibilidade
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", elemento)
        time.sleep(1)
        
        select = Select(elemento)
        
        # Tenta selecionar pelo texto
        # Às vezes o texto no site tem espaços extras, então vamos ser flexíveis
        opcoes = [op.text for op in select.options]
        for op in opcoes:
            if texto_visivel.lower() in op.lower():
                select.select_by_visible_text(op)
                return True
        
        print(f"      ⚠️ Opção '{texto_visivel}' não encontrada no menu.")
        return False
    except Exception as e:
        print(f"      ⚠️ Erro no dropdown: {e}")
        return False

def capturar_matriculas(driver, ano, nome_filtro):
    """ Lê os cards da tela para pegar matrículas detalhadas """
    dados = []
    # Palavras-chave esperadas nos cards
    termos = [
        "Creche", "Pré-escola", 
        "Anos Iniciais", "Anos Finais", 
        "1º ano", "2º ano", "3º ano", "4º ano", "5º ano",
        "6º ano", "7º ano", "8º ano", "9º ano",
        "EJA", "Educação Especial"
    ]
    
    try:
        # Pega todo o texto do container principal
        container = driver.find_element(By.ID, "main")
        texto_pagina = container.text.split('\n')
        
        for linha in texto_pagina:
            for termo in termos:
                if termo in linha:
                    # Limpeza para extrair número (ex: "Creche 5.200")
                    import re
                    # Acha números na linha
                    nums = re.findall(r'\b\d{1,3}(?:\.\d{3})*\b', linha)
                    
                    valores_validos = []
                    for n in nums:
                        v = int(n.replace('.', ''))
                        # Filtra o ano (2024) e números absurdos
                        if v != int(ano) and v < 500000:
                            valores_validos.append(v)
                    
                    if valores_validos:
                        dados.append({
                            "Ano": ano,
                            "Filtro Aplicado": nome_filtro,
                            "Modalidade": termo,
                            "Matrículas": max(valores_validos)
                        })
    except:
        pass
    return dados

def main():
    driver = configurar_driver()
    todos_dados_escolas = []
    todos_dados_matriculas = []

    try:
        print("🚀 Iniciando Extração por Filtros...")
        driver.get(URL_BASE)
        time.sleep(5)

        # --- LOOP EXTERNO: FILTROS (Infantil -> Fundamental) ---
        for nome_filtro in FILTROS_MODALIDADE:
            print(f"\n============================================")
            print(f"📂 INICIANDO FILTRO: {nome_filtro}")
            print(f"============================================")
            
            # --- LOOP INTERNO: ANOS (2024 -> 2010) ---
            for ano in ANOS_BUSCA:
                print(f"\n📅 Processando: {ano} ({nome_filtro})")
                
                # 1. SELECIONAR ANO (Select 1)
                xpath_ano = '//*[@id="main"]/main/div/div[2]/div[1]/div[1]/select[1]'
                if not selecionar_dropdown(driver, xpath_ano, ano):
                    print(f"   (Ano {ano} indisponível, pulando)")
                    continue
                
                time.sleep(3) # Espera carregar ano

                # 2. SELECIONAR REDE MUNICIPAL (Select 2)
                xpath_rede = '//*[@id="main"]/main/div/div[2]/div[1]/div[1]/select[2]'
                selecionar_dropdown(driver, xpath_rede, "Municipal")
                
                time.sleep(3) # Espera carregar rede

                # 3. SELECIONAR O FILTRO DA VEZ (Select 4 - O que você mandou)
                xpath_filtro = '//*[@id="main"]/main/div/div[2]/div[1]/div[1]/select[4]'
                if not selecionar_dropdown(driver, xpath_filtro, nome_filtro):
                    print("   (Filtro não encontrado neste ano, tentando continuar...)")
                
                time.sleep(5) # Espera site montar a tela com o filtro novo

                # 4. CAPTURAR TOTAL DE ESCOLAS
                xpath_valor_escolas = '//*[@id="main"]/main/div/div[2]/div[1]/div[3]/div[2]/div[1]/div[2]/span[1]'
                try:
                    elem = driver.find_element(By.XPATH, xpath_valor_escolas)
                    qtd_escolas = elem.text.strip()
                    print(f"   🏫 Escolas: {qtd_escolas}")
                    
                    todos_dados_escolas.append({
                        "Ano": ano,
                        "Filtro Aplicado": nome_filtro,
                        "Total Escolas": qtd_escolas
                    })
                except:
                    print("   ⚠️ Valor de escolas não visível.")
                    todos_dados_escolas.append({
                        "Ano": ano, 
                        "Filtro Aplicado": nome_filtro, 
                        "Total Escolas": "N/D"
                    })

                # 5. CAPTURAR MATRÍCULAS DA TELA
                mats = capturar_matriculas(driver, ano, nome_filtro)
                if mats:
                    print(f"   🔍 Matrículas capturadas: {len(mats)} registros.")
                    todos_dados_matriculas.extend(mats)
                else:
                    print("   ⚠️ Nenhuma matrícula específica encontrada na tela.")

    except Exception as e:
        print(f"❌ Erro Fatal: {e}")

    finally:
        print("\n💾 Salvando arquivo Excel...")
        if todos_dados_escolas or todos_dados_matriculas:
            with pd.ExcelWriter(ARQUIVO_SAIDA, engine='openpyxl') as writer:
                # Aba 1: Escolas
                if todos_dados_escolas:
                    pd.DataFrame(todos_dados_escolas).to_excel(writer, sheet_name='Qtd_Escolas', index=False)
                
                # Aba 2: Matrículas
                if todos_dados_matriculas:
                    # Remove duplicatas
                    df_mat = pd.DataFrame(todos_dados_matriculas).drop_duplicates()
                    df_mat.to_excel(writer, sheet_name='Matriculas_Detalhadas', index=False)
            
            print(f"✅ Arquivo salvo em: {ARQUIVO_SAIDA}")
        
        driver.quit()

if __name__ == "__main__":
    main()
