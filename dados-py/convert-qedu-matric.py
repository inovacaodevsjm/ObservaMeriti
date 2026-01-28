import time
import re
import pandas as pd
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import Select

# --- CONFIGURAÇÃO ---
URL_BASE = "https://qedu.org.br/municipio/3305109-sao-joao-de-meriti/censo-escolar"
ARQUIVO_SAIDA = r"C:\Users\user\Desktop\Observatório de Dados\dados-py\Censo_SJM_Matriculas_6_Itens_Garantidos.xlsx"

# Anos (2024 a 2010)
ANOS_BUSCA = [str(ano) for ano in range(2024, 2009, -1)]

FILTROS_MODALIDADE = [
    "Com Ensino Infantil Regular",
    "Com Ensino Fundamental Regular"
]

# MAPA DE DIVS FIXAS (Baseado no que você passou)
# O robô vai ir direto nesses endereços.
MAPA_DIVS = {
    "Creche":            '//*[@id="main"]/main/div/div[2]/div[1]/div[3]/div[2]/div[5]',
    "Pré-escola":        '//*[@id="main"]/main/div/div[2]/div[1]/div[3]/div[2]/div[6]',
    "Anos Iniciais":     '//*[@id="main"]/main/div/div[2]/div[1]/div[3]/div[2]/div[7]',
    "Anos Finais":       '//*[@id="main"]/main/div/div[2]/div[1]/div[3]/div[2]/div[8]',
    "EJA":               '//*[@id="main"]/main/div/div[2]/div[1]/div[3]/div[2]/div[10]',
    "Educação Especial": '//*[@id="main"]/main/div/div[2]/div[1]/div[3]/div[2]/div[11]'
}

def configurar_driver():
    options = Options()
    options.add_argument("--start-maximized")
    options.add_argument("--ignore-certificate-errors")
    return webdriver.Chrome(options=options)

def selecionar_dropdown(driver, xpath, texto_visivel, sleep_time=3):
    try:
        wait = WebDriverWait(driver, 5)
        elem = wait.until(EC.element_to_be_clickable((By.XPATH, xpath)))
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", elem)
        
        select = Select(elem)
        opcoes = [op.text for op in select.options]
        for op in opcoes:
            if texto_visivel.lower() in op.lower():
                select.select_by_visible_text(op)
                time.sleep(sleep_time)
                return True
        return False
    except:
        return False

def extrair_valor_div(driver, xpath_div, ano_ignorar):
    """ Vai na div específica e caça o maior número que encontrar nela """
    try:
        # Pega a div
        elem = driver.find_element(By.XPATH, xpath_div)
        # Pega todo o conteúdo de texto (textContent pega até o que está escondido)
        texto_completo = elem.get_attribute("textContent")
        
        # Se quiser debug, descomente:
        # print(f"   [Lendo Div]: {texto_completo[:20]}...")

        # Limpa e busca números
        numeros = re.findall(r'\b\d{1,3}(?:\.\d{3})*\b', texto_completo)
        
        validos = []
        for n in numeros:
            v = int(n.replace('.', ''))
            # Filtros básicos
            if v != int(ano_ignorar) and v < 500000:
                validos.append(v)
        
        if validos:
            return max(validos)
        
    except:
        # Se a div não existir (ex: layout mudou), retorna 0
        pass
        
    return 0

def main():
    driver = configurar_driver()
    todos_dados = []

    try:
        print("🚀 Iniciando Coleta (Garantindo 6 Itens)...")
        driver.get(URL_BASE)
        time.sleep(5)

        xpath_ano = '//*[@id="main"]/main/div/div[2]/div[1]/div[1]/select[1]'
        xpath_rede = '//*[@id="main"]/main/div/div[2]/div[1]/div[1]/select[2]'
        xpath_filtro = '//*[@id="main"]/main/div/div[2]/div[1]/div[1]/select[4]'

        for nome_filtro in FILTROS_MODALIDADE:
            print(f"\n📂 FILTRO: {nome_filtro}")
            
            for ano in ANOS_BUSCA:
                print(f"   📅 Ano: {ano}...", end="")
                
                # 1. Navegação
                if not selecionar_dropdown(driver, xpath_ano, ano):
                    print(" (Pulei)")
                    continue
                
                selecionar_dropdown(driver, xpath_rede, "Municipal", sleep_time=3)
                selecionar_dropdown(driver, xpath_filtro, nome_filtro, sleep_time=4)

                # 2. Extração Fixa
                # Itera sobre o mapa e força a busca em cada endereço
                count = 0
                for nome_etapa, xpath in MAPA_DIVS.items():
                    valor = extrair_valor_div(driver, xpath, ano)
                    
                    todos_dados.append({
                        "Ano": ano,
                        "Filtro Geral": nome_filtro,
                        "Etapa": nome_etapa,
                        "Matrículas": valor
                    })
                    if valor > 0: count += 1
                
                print(f" -> {count} valores encontrados (6 linhas geradas).")

    except Exception as e:
        print(f"❌ Erro Fatal: {e}")

    finally:
        print("\n💾 Salvando Excel...")
        if todos_dados:
            df = pd.DataFrame(todos_dados)
            # Ordenação
            try:
                ordem = {"Creche": 1, "Pré-escola": 2, "Anos Iniciais": 3, "Anos Finais": 4, "EJA": 5, "Educação Especial": 6}
                df['Rank'] = df['Etapa'].map(ordem)
                df = df.sort_values(by=["Filtro Geral", "Ano", "Rank"], ascending=[True, False, True])
                df = df.drop(columns=['Rank'])
            except:
                pass

            df.to_excel(ARQUIVO_SAIDA, index=False)
            print(f"✅ Arquivo salvo em: {ARQUIVO_SAIDA}")
        else:
            print("❌ Nenhum dado coletado.")
        
        driver.quit()

if __name__ == "__main__":
    main()