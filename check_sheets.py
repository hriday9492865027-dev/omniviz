import openpyxl

wb = openpyxl.load_workbook('EDA_RESULTS.xlsx')
print('Sheet names:', wb.sheetnames)
