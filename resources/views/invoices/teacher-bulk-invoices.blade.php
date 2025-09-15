<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factures groupées</title>
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f9fafb; 
        }
        .invoice-container { 
            max-width: 800px; 
            margin: 20px auto; 
            padding: 30px; 
            background-color: #ffffff; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
        }
        .invoice-header { 
            text-align: center; 
            margin-bottom: 30px; 
        }
        .invoice-header img { 
            width: 120px; 
            margin-bottom: 15px; 
        }
        .invoice-header h1 { 
            font-size: 28px; 
            font-weight: 600; 
            color: #1a1a1a; 
            margin: 0; 
        }
        .invoice-header p { 
            font-size: 14px; 
            color: #666; 
            margin: 5px 0; 
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px; 
        }
        th, td { 
            border: 1px solid #e5e7eb; 
            padding: 12px; 
            text-align: left; 
        }
        th { 
            background-color: #f3f4f6; 
            font-weight: 600; 
            color: #1a1a1a; 
        }
        td { 
            background-color: #ffffff; 
            color: #444; 
        }
        .total { 
            font-size: 18px; 
            font-weight: 600; 
            text-align: right; 
            color: #1a1a1a; 
            margin-top: 20px; 
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            font-size: 12px; 
            color: #666; 
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- En-tête avec logo -->
        <div class="invoice-header">
            <img src="{{ public_path('logo.png') }}" alt="Logo de l'entreprise">
            <h1>Factures groupées</h1>
            <p>Généré le : {{ now()->format('Y-m-d') }}</p>
        </div>

        <!-- Tableau des factures -->
        <table>
            <thead>
                <tr>
                    <th>ID Facture</th>
                    <th>Nom de l'élève</th>
                    <th>Classe</th>
                    <th>Offre</th>
                    <th>Date de facturation</th>
                    <th>Montant total</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($invoices as $invoice)
                    <tr>
                        <td>{{ $invoice->id }}</td>
                        <td>{{ $invoice->student->firstName }} {{ $invoice->student->lastName }}</td>
                        <td>{{ $invoice->className }}</td>
                        <td>{{ $invoice->offer->offer_name }}</td>
                        <td>{{ $invoice->billDate }}</td>
                        <td>{{ $invoice->totalAmount }} DH</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Pied de page -->
        <div class="footer">
            <p>Merci pour votre confiance !</p>
            <p>Nom de l'entreprise | Adresse | Téléphone | Email</p>
        </div>
    </div>
</body>
</html>