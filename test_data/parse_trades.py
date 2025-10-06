import json
import pandas as pd
from typing import List, Dict, Any

def flatten_trade_data(json_file_path: str, output_csv_path: str = 'trade_data_flattened.csv'):
    """
    Parse JSON trade data and flatten it into CSV format.
    Each leg becomes a separate row with contract-level fields repeated.
    """
    
    # Read the JSON file
    with open(json_file_path, 'r', encoding='utf-8') as file:
        trade_data = json.load(file)
    
    flattened_rows = []
    
    for trade in trade_data:
        # Extract contract-level fields
        contract_fields = trade.get('Contract-Level Fields', {})
        leg_fields = trade.get('Leg-Level Fields', {})
        
        # Process each leg
        for leg_name, leg_data in leg_fields.items():
            # Create a row combining contract and leg data
            row = {}
            
            # Add contract-level fields with prefix
            for key, value in contract_fields.items():
                row[f'Contract_{key.replace(" ", "_").replace("-", "_")}'] = value
            
            # Add leg identifier
            row['Leg_Number'] = leg_name
            
            # Add leg-level fields with prefix
            for key, value in leg_data.items():
                row[f'Leg_{key.replace(" ", "_").replace("-", "_")}'] = value
            
            flattened_rows.append(row)
    
    # Convert to DataFrame and save as CSV
    df = pd.DataFrame(flattened_rows)
    df.to_csv(output_csv_path, index=False)
    
    print(f"Successfully converted {len(trade_data)} trades ({len(flattened_rows)} legs) to CSV")
    print(f"Output saved as: {output_csv_path}")
    print(f"Columns: {len(df.columns)}")
    print("\nFirst few column names:")
    for i, col in enumerate(df.columns[:10]):
        print(f"  {i+1}. {col}")
    
    return df

def preview_data(csv_file_path: str, num_rows: int = 5):
    """
    Preview the first few rows of the CSV file
    """
    df = pd.read_csv(csv_file_path)
    print(f"\nPreview of first {num_rows} rows:")
    print(df.head(num_rows).to_string())
    return df

if __name__ == "__main__":
    # Usage example
    # Replace 'trade_data.json' with your actual JSON file path
    
    # Parse the JSON file
    df = flatten_trade_data('trade_data.json')
    
    # Preview the results
    preview_data('trade_data_flattened.csv')
    
    # Show summary statistics
    print(f"\nDataset Summary:")
    print(f"Total rows (legs): {len(df)}")
    print(f"Total columns: {len(df.columns)}")
    print(f"Unique trades: {df['Contract_Trade_ID'].nunique()}")
    print(f"Unique counterparties: {df['Contract_Counterparty'].nunique()}")
