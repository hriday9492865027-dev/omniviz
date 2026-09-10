import pandas as pd
import numpy as np

# Load dataset
df = pd.read_csv('ecommerce_sales_dataset.csv')

# Ensure Order_Date is datetime
df['Order_Date'] = pd.to_datetime(df['Order_Date'])

print('=' * 80)
print('1. OVERALL BUSINESS PERFORMANCE')
print('=' * 80)
tot_rev = df['Revenue'].sum()
tot_cost = df['Cost'].sum()
tot_profit = df['Profit'].sum()
overall_margin = (tot_profit / tot_rev) * 100
mean_margin = df['Profit_Margin_%'].mean()
tot_orders = len(df)
tot_qty = df['Quantity'].sum()
aov = df['Revenue'].mean()
print(f'Total Revenue: ${tot_rev:,.2f}')
print(f'Total Cost: ${tot_cost:,.2f}')
print(f'Total Profit: ${tot_profit:,.2f}')
print(f'Overall Profit Margin: {overall_margin:.4f}% (Mean of order margins: {mean_margin:.4f}%)')
print(f'Total Orders: {tot_orders:,}')
print(f'Total Quantity: {tot_qty:,}')
print(f'Average Order Value: ${aov:,.2f}')

print('\n' + '=' * 80)
print('2. TIME ANALYSIS')
print('=' * 80)
# By Year
year_df = df.groupby('Year').agg(
    Orders=('Order_ID', 'count'),
    Revenue=('Revenue', 'sum'),
    Cost=('Cost', 'sum'),
    Profit=('Profit', 'sum'),
    Avg_AOV=('Revenue', 'mean'),
    Avg_Discount=('Discount', 'mean')
).reset_index()
year_df['Margin_%'] = (year_df['Profit'] / year_df['Revenue']) * 100
print('\n--- By Year ---')
print(year_df.to_string(index=False))

# By Quarter
quarter_df = df.groupby('Quarter').agg(
    Orders=('Order_ID', 'count'),
    Revenue=('Revenue', 'sum'),
    Cost=('Cost', 'sum'),
    Profit=('Profit', 'sum'),
    Avg_AOV=('Revenue', 'mean'),
    Avg_Discount=('Discount', 'mean')
).reset_index()
quarter_df['Margin_%'] = (quarter_df['Profit'] / quarter_df['Revenue']) * 100
print('\n--- By Quarter ---')
print(quarter_df.to_string(index=False))

# Year-Quarter
yq_df = df.groupby(['Year', 'Quarter']).agg(
    Orders=('Order_ID', 'count'),
    Revenue=('Revenue', 'sum'),
    Profit=('Profit', 'sum')
).reset_index()
yq_df['Margin_%'] = (yq_df['Profit'] / yq_df['Revenue']) * 100
print('\n--- Year-Quarter Breakdown ---')
print(yq_df.to_string(index=False))

# By Season
season_df = df.groupby('Season').agg(
    Orders=('Order_ID', 'count'),
    Revenue=('Revenue', 'sum'),
    Cost=('Cost', 'sum'),
    Profit=('Profit', 'sum'),
    Avg_AOV=('Revenue', 'mean'),
    Avg_Discount=('Discount', 'mean')
).reset_index()
season_df['Margin_%'] = (season_df['Profit'] / season_df['Revenue']) * 100
print('\n--- By Season ---')
print(season_df.to_string(index=False))

# Monthly trends
monthly_df = df.groupby(['Year', 'Month']).agg(
    Orders=('Order_ID', 'count'),
    Revenue=('Revenue', 'sum'),
    Profit=('Profit', 'sum')
).reset_index()
monthly_df['Margin_%'] = (monthly_df['Profit'] / monthly_df['Revenue']) * 100
print('\n--- Monthly Trend (All Months) ---')
print(monthly_df.to_string(index=False))

# Aggregated Month (Jan-Dec across all years)
month_agg = df.groupby('Month').agg(
    Orders=('Order_ID', 'count'),
    Revenue=('Revenue', 'sum'),
    Profit=('Profit', 'sum')
).reset_index()
month_agg['Margin_%'] = (month_agg['Profit'] / month_agg['Revenue']) * 100
print('\n--- Month of Year (Aggregated 1-12) ---')
print(month_agg.to_string(index=False))

print('\n' + '=' * 80)
print('3. PRODUCT ANALYSIS')
print('=' * 80)
cat_df = df.groupby('Category').agg(
    Orders=('Order_ID', 'count'),
    Quantity=('Quantity', 'sum'),
    Revenue=('Revenue', 'sum'),
    Cost=('Cost', 'sum'),
    Profit=('Profit', 'sum')
).reset_index()
cat_df['Rev_Share_%'] = (cat_df['Revenue'] / tot_rev) * 100
cat_df['Profit_Share_%'] = (cat_df['Profit'] / tot_profit) * 100
cat_df['Margin_%'] = (cat_df['Profit'] / cat_df['Revenue']) * 100
print('\n--- By Category ---')
print(cat_df.sort_values(by='Revenue', ascending=False).to_string(index=False))

subcat_df = df.groupby(['Category', 'Sub_Category']).agg(
    Orders=('Order_ID', 'count'),
    Quantity=('Quantity', 'sum'),
    Revenue=('Revenue', 'sum'),
    Cost=('Cost', 'sum'),
    Profit=('Profit', 'sum')
).reset_index()
subcat_df['Rev_Share_%'] = (subcat_df['Revenue'] / tot_rev) * 100
subcat_df['Profit_Share_%'] = (subcat_df['Profit'] / tot_profit) * 100
subcat_df['Margin_%'] = (subcat_df['Profit'] / subcat_df['Revenue']) * 100
print('\n--- By Sub-Category (Sorted by Revenue) ---')
print(subcat_df.sort_values(by='Revenue', ascending=False).to_string(index=False))

# Product Level
prod_df = df.groupby(['Category', 'Sub_Category', 'Product_Name']).agg(
    Orders=('Order_ID', 'count'),
    Quantity=('Quantity', 'sum'),
    Revenue=('Revenue', 'sum'),
    Cost=('Cost', 'sum'),
    Profit=('Profit', 'sum'),
    Loss_Orders=('Profit', lambda x: (x < 0).sum())
).reset_index()
prod_df['Margin_%'] = (prod_df['Profit'] / prod_df['Revenue']) * 100

print('\n--- Top 10 Products by Revenue ---')
top10_rev = prod_df.sort_values(by='Revenue', ascending=False).head(10)
print(top10_rev[['Product_Name', 'Category', 'Sub_Category', 'Orders', 'Quantity', 'Revenue', 'Cost', 'Profit', 'Margin_%']].to_string(index=False))

print('\n--- Top 10 Products by Profit ---')
top10_prof = prod_df.sort_values(by='Profit', ascending=False).head(10)
print(top10_prof[['Product_Name', 'Category', 'Sub_Category', 'Orders', 'Quantity', 'Revenue', 'Cost', 'Profit', 'Margin_%', 'Loss_Orders']].to_string(index=False))

print('\n--- Bottom 10 Products by Profit ---')
bot10_prof = prod_df.sort_values(by='Profit', ascending=True).head(10)
print(bot10_prof[['Product_Name', 'Category', 'Sub_Category', 'Orders', 'Quantity', 'Revenue', 'Cost', 'Profit', 'Margin_%', 'Loss_Orders']].to_string(index=False))

print('\n' + '=' * 80)
print('4. CUSTOMER ANALYSIS')
print('=' * 80)
seg_df = df.groupby('Customer_Segment').agg(
    Orders=('Order_ID', 'count'),
    Unique_Customers=('Customer_ID', 'nunique'),
    Revenue=('Revenue', 'sum'),
    Cost=('Cost', 'sum'),
    Profit=('Profit', 'sum'),
    Loss_Orders=('Profit', lambda x: (x < 0).sum()),
    Avg_Discount=('Discount', 'mean')
).reset_index()
seg_df['AOV'] = seg_df['Revenue'] / seg_df['Orders']
seg_df['Margin_%'] = (seg_df['Profit'] / seg_df['Revenue']) * 100
seg_df['Orders_per_Cust'] = seg_df['Orders'] / seg_df['Unique_Customers']
print('\n--- By Customer Segment ---')
print(seg_df.sort_values(by='Revenue', ascending=False).to_string(index=False))

gender_df = df.groupby('Customer_Gender').agg(
    Orders=('Order_ID', 'count'),
    Revenue=('Revenue', 'sum'),
    Cost=('Cost', 'sum'),
    Profit=('Profit', 'sum'),
    Loss_Orders=('Profit', lambda x: (x < 0).sum()),
    Avg_Discount=('Discount', 'mean')
).reset_index()
gender_df['AOV'] = gender_df['Revenue'] / gender_df['Orders']
gender_df['Margin_%'] = (gender_df['Profit'] / gender_df['Revenue']) * 100
print('\n--- By Customer Gender ---')
print(gender_df.to_string(index=False))

print('\n' + '=' * 80)
print('5. GEOGRAPHIC ANALYSIS')
print('=' * 80)
region_df = df.groupby('Region').agg(
    Orders=('Order_ID', 'count'),
    Revenue=('Revenue', 'sum'),
    Cost=('Cost', 'sum'),
    Profit=('Profit', 'sum'),
    Avg_Shipping_Days=('Shipping_Days', 'mean'),
    Avg_Shipping_Cost=('Shipping_Cost', 'mean'),
    Loss_Orders=('Profit', lambda x: (x < 0).sum())
).reset_index()
region_df['Rev_Share_%'] = (region_df['Revenue'] / tot_rev) * 100
region_df['Margin_%'] = (region_df['Profit'] / region_df['Revenue']) * 100
print('\n--- By Region ---')
print(region_df.sort_values(by='Revenue', ascending=False).to_string(index=False))

country_df = df.groupby(['Region', 'Country']).agg(
    Orders=('Order_ID', 'count'),
    Revenue=('Revenue', 'sum'),
    Profit=('Profit', 'sum'),
    Avg_Shipping_Days=('Shipping_Days', 'mean'),
    Loss_Orders=('Profit', lambda x: (x < 0).sum())
).reset_index()
country_df['Margin_%'] = (country_df['Profit'] / country_df['Revenue']) * 100

print('\n--- Top Countries by Revenue ---')
print(country_df.sort_values(by='Revenue', ascending=False).head(10).to_string(index=False))

print('\n--- Top Countries by Profit ---')
print(country_df.sort_values(by='Profit', ascending=False).head(10).to_string(index=False))

print('\n--- Bottom Countries by Profit ---')
print(country_df.sort_values(by='Profit', ascending=True).head(10).to_string(index=False))

print('\n' + '=' * 80)
print('6. DISCOUNT ANALYSIS')
print('=' * 80)
disc_df = df.groupby('Discount').agg(
    Orders=('Order_ID', 'count'),
    Revenue=('Revenue', 'sum'),
    Cost=('Cost', 'sum'),
    Profit=('Profit', 'sum'),
    Loss_Orders=('Profit', lambda x: (x < 0).sum()),
    Loss_Dollars=('Profit', lambda x: x[x < 0].sum())
).reset_index()
disc_df['Margin_%'] = (disc_df['Profit'] / disc_df['Revenue']) * 100
disc_df['Loss_Rate_%'] = (disc_df['Loss_Orders'] / disc_df['Orders']) * 100
print('\n--- Performance by Discount Tier ---')
print(disc_df.to_string(index=False))

print('\n' + '=' * 80)
print('7. LOGISTICS ANALYSIS')
print('=' * 80)
ship_df = df.groupby('Shipping_Method').agg(
    Orders=('Order_ID', 'count'),
    Revenue=('Revenue', 'sum'),
    Cost=('Cost', 'sum'),
    Profit=('Profit', 'sum'),
    Freight_Total=('Shipping_Cost', 'sum'),
    Avg_Freight=('Shipping_Cost', 'mean'),
    Min_Days=('Shipping_Days', 'min'),
    Median_Days=('Shipping_Days', 'median'),
    Mean_Days=('Shipping_Days', 'mean'),
    Max_Days=('Shipping_Days', 'max')
).reset_index()
ship_df['Net_Profit_After_Shipping'] = ship_df['Profit'] - ship_df['Freight_Total']
ship_df['Gross_Margin_%'] = (ship_df['Profit'] / ship_df['Revenue']) * 100
ship_df['Net_Margin_%'] = (ship_df['Net_Profit_After_Shipping'] / ship_df['Revenue']) * 100
print('\n--- By Shipping Method ---')
print(ship_df.to_string(index=False))

# Shipping Days vs Method and Region
cross_ship = df.groupby(['Region', 'Shipping_Method'])['Shipping_Days'].mean().unstack()
print('\n--- Average Shipping Days by Region and Shipping Method ---')
print(cross_ship)

print('\n' + '=' * 80)
print('8. ORDER STATUS')
print('=' * 80)
status_df = df.groupby('Order_Status').agg(
    Orders=('Order_ID', 'count'),
    Revenue=('Revenue', 'sum'),
    Profit=('Profit', 'sum'),
    Freight=('Shipping_Cost', 'sum'),
    Avg_Days=('Shipping_Days', 'mean')
).reset_index()
status_df['Order_%'] = (status_df['Orders'] / tot_orders) * 100
status_df['Rev_%'] = (status_df['Revenue'] / tot_rev) * 100
status_df['Profit_%'] = (status_df['Profit'] / tot_profit) * 100
status_df['Margin_%'] = (status_df['Profit'] / status_df['Revenue']) * 100
print('\n--- By Order Status ---')
print(status_df.to_string(index=False))

# Return and Cancellation rates by Category
cat_status = pd.crosstab(df['Category'], df['Order_Status'], normalize='index') * 100
print('\n--- Order Status % by Category ---')
print(cat_status)

# Return and Cancellation rates by Segment
seg_status = pd.crosstab(df['Customer_Segment'], df['Order_Status'], normalize='index') * 100
print('\n--- Order Status % by Customer Segment ---')
print(seg_status)

# Return and Cancellation rates by Region
reg_status = pd.crosstab(df['Region'], df['Order_Status'], normalize='index') * 100
print('\n--- Order Status % by Region ---')
print(reg_status)

print('\n' + '=' * 80)
print('9. PROFITABILITY & LOSS AUDIT')
print('=' * 80)
loss_df = df[df['Profit'] < 0]
tot_loss_orders = len(loss_df)
tot_loss_pct = (tot_loss_orders / tot_orders) * 100
tot_loss_dollars = loss_df['Profit'].sum()
print(f'Total Loss-making orders: {tot_loss_orders} ({tot_loss_pct:.2f}%)')
print(f'Total Loss Dollars: ${tot_loss_dollars:,.2f}')

cat_loss = df.groupby('Category').agg(
    Total_Orders=('Order_ID', 'count'),
    Loss_Orders=('Profit', lambda x: (x < 0).sum()),
    Total_Loss_Dollars=('Profit', lambda x: x[x < 0].sum()),
    Net_Profit=('Profit', 'sum')
).reset_index()
cat_loss['Loss_Rate_%'] = (cat_loss['Loss_Orders'] / cat_loss['Total_Orders']) * 100
print('\n--- Loss Orders by Category ---')
print(cat_loss.sort_values(by='Loss_Orders', ascending=False).to_string(index=False))

# Products with negative profit overall?
print(f'Are there any products with net negative total profit across all transactions? {(prod_df["Profit"] < 0).sum()}')
prod_loss = loss_df.groupby('Product_Name').agg(
    Loss_Orders=('Order_ID', 'count'),
    Loss_Dollars=('Profit', 'sum'),
    Avg_Discount=('Discount', 'mean'),
    Min_Discount=('Discount', 'min')
).reset_index().sort_values(by='Loss_Dollars', ascending=True)
print('\n--- Top 10 Products by Total Losses Incurred ---')
print(prod_loss.head(10).to_string(index=False))

# Regions with negative profit transactions
reg_loss = df.groupby('Region').agg(
    Total_Orders=('Order_ID', 'count'),
    Loss_Orders=('Profit', lambda x: (x < 0).sum()),
    Total_Loss_Dollars=('Profit', lambda x: x[x < 0].sum()),
    Net_Profit=('Profit', 'sum')
).reset_index()
reg_loss['Loss_Rate_%'] = (reg_loss['Loss_Orders'] / reg_loss['Total_Orders']) * 100
print('\n--- Loss Orders by Region ---')
print(reg_loss.to_string(index=False))

print('\n' + '=' * 80)
print('10. STATISTICAL RELATIONSHIPS (PEARSON CORRELATIONS)')
print('=' * 80)
pairs = [
    ('Revenue', 'Profit'),
    ('Discount', 'Profit'),
    ('Discount', 'Profit_Margin_%'),
    ('Quantity', 'Revenue'),
    ('Shipping_Cost', 'Profit'),
    ('Shipping_Days', 'Profit'),
    ('Revenue', 'Cost'),
    ('Shipping_Cost', 'Shipping_Days')
]
for col1, col2 in pairs:
    r = df[col1].corr(df[col2])
    print(f'Correlation {col1} vs {col2}: {r:.6f}')
