<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture {{ $invoice->id }}</title>
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
        .invoice-details { 
            margin-bottom: 30px; 
        }
        .invoice-details h2 { 
            font-size: 20px; 
            font-weight: 600; 
            color: #1a1a1a; 
            margin-bottom: 15px; 
        }
        .invoice-details p { 
            font-size: 14px; 
            color: #444; 
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
            <h1>Facture n°{{ $invoice->id }}</h1>
            <p>Date : {{ $invoice->creationDate }}</p>
        </div>

        <!-- Détails de la facture -->
        <div class="invoice-details">
            <h2>Informations sur l'élève</h2>
            <p><strong>Nom :</strong> {{ $invoice->student->firstName }} {{ $invoice->student->lastName }}</p>
            <p><strong>Classe :</strong> {{ $invoice->className }}</p>
            <p><strong>Offre :</strong> {{ $invoice->offer->offer_name }}</p>
        </div>

        <!-- Tableau de la facture -->
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Montant</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Montant total</td>
                    <td>{{ $invoice->totalAmount }} DH</td>
                </tr>
            </tbody>
        </table>

        <!-- Total -->
        <div class="total">
            <p><strong>Total :</strong> {{ $invoice->totalAmount }} DH</p>
        </div>

        <!-- Pied de page -->
        <div class="footer">
            <p>Merci pour votre confiance !</p>
            <p>Centre Red city | Adresse | Téléphone | Email</p>
        </div>
    </div>
</body>
</html>