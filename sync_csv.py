import pandas as pd
import openpyxl
import csv

wb = openpyxl.load_workbook('EDA_RESULTS.xlsx')
ws = wb['EDA_RESULTS']

with open('EDA_RESULTS.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    for row in ws.iter_rows(values_only=True):
        # Trim empty trailing None cells
        row_list = list(row)
        while row_list and row_list[-1] is None:
            row_list.pop()
        writer.writerow(row_list)

print("Successfully synchronized EDA_RESULTS.csv with EDA_RESULTS.xlsx!")
