import pandas as pd

df = pd.read_csv('ecommerce_sales_dataset.csv')

# 1. Monthly (Year x Month)
ym = df.groupby(['Year', 'Month']).agg(
    Orders=('Order_ID', 'count'),
    Revenue=('Revenue', 'sum'),
    Cost=('Cost', 'sum'),
    Profit=('Profit', 'sum')
).reset_index()
ym['Margin_%'] = (ym['Profit'] / ym['Revenue']) * 100
print("--- ALL 48 YEAR-MONTHS ---")
print(ym.to_string(index=False))
