#!/usr/bin/env python3
"""
Script para agregar los 3 asesores faltantes con el formato de email correcto
"""

from agregar_asesor import agregar_asesor
import time

asesores = [
    {"nombre": "Sebastián Antonio André Aguirre Fiestas", "dni": "72048710"},
    {"nombre": "Giner Alexander Loayza Gonzaga", "dni": "60826335"}
]

def main():
    print("\n" + "="*60)
    print("  AGREGANDO ASESORES FALTANTES CON EMAILS CORRECTOS")
    print("="*60)
    
    exitosos = 0
    fallidos = 0
    
    for i, asesor in enumerate(asesores, 1):
        print(f"\n[{i}/{len(asesores)}] Procesando: {asesor['nombre']}")
        print("-"*60)
        
        if agregar_asesor(asesor['nombre'], asesor['dni']):
            exitosos += 1
        else:
            fallidos += 1
        
        # Esperar 1 segundo entre inserciones
        if i < len(asesores):
            time.sleep(1)
    
    print("\n" + "="*60)
    print("  RESUMEN")
    print("="*60)
    print(f"  ✅ Exitosos: {exitosos}")
    print(f"  ❌ Fallidos:  {fallidos}")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
