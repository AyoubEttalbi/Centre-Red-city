<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport des Gains - {{ $summaryData['teacherName'] }}</title>
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f9fafb; 
        }
        .report-container { 
            max-width: 800px; 
            margin: 20px auto; 
            padding: 30px; 
            background-color: #ffffff; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
        }
        .report-header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #3B82F6;
            padding-bottom: 20px;
        }
        .report-header img { 
            width: 120px; 
            margin-bottom: 15px; 
        }
        .report-header h1 { 
            font-size: 28px; 
            font-weight: 600; 
            color: #1a1a1a; 
            margin: 0; 
        }
        .report-header p { 
            font-size: 14px; 
            color: #666; 
            margin: 5px 0; 
        }
        .summary-section {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
            border-left: 4px solid #3B82F6;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .summary-item {
            text-align: center;
            padding: 15px;
            background-color: white;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .summary-item h3 {
            font-size: 14px;
            color: #666;
            margin: 0 0 8px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary-item .value {
            font-size: 24px;
            font-weight: 700;
            color: #3B82F6;
        }
        .summary-item .income {
            color: #10B981;
        }
        .summary-item .invoices {
            color: #8B5CF6;
        }
        .date-info {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 10px;
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
            font-size: 12px;
        }
        th { 
            background-color: #3B82F6; 
            color: white; 
            font-weight: 600; 
        }
        td { 
            background-color: #ffffff; 
            color: #444; 
        }
        .amount {
            font-weight: 600;
            color: #10B981;
        }
        .months {
            text-align: center;
            background-color: #EFF6FF;
            color: #1E40AF;
            font-weight: 600;
            border-radius: 4px;
            padding: 2px 6px;
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            font-size: 12px; 
            color: #666; 
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- En-tête du rapport -->
        <div class="report-header">
            <img src="{{ public_path('logo.png') }}" alt="Logo de l'entreprise">
            <h1>Rapport des Gains</h1>
            <p>{{ $summaryData['teacherName'] }}</p>
            <p>Période : {{ $summaryData['dateRange'] }}</p>
        </div>

        <!-- Section de résumé -->
        <div class="summary-section">
            <h2 style="margin: 0 0 20px 0; color: #1a1a1a; text-align: center;">Résumé des Gains</h2>
            <div class="summary-grid">
                <div class="summary-item">
                    <h3>Total des Gains</h3>
                    <div class="value income">{{ number_format($summaryData['totalIncome'], 2) }} DH</div>
                </div>
                <div class="summary-item">
                    <h3>Nombre de Factures</h3>
                    <div class="value invoices">{{ $summaryData['totalInvoices'] }}</div>
                </div>
            </div>
            <div class="date-info">
                Généré le : {{ $summaryData['generatedDate'] }}
            </div>
        </div>

        <!-- Tableau détaillé des factures -->
        <h2 style="margin: 30px 0 20px 0; color: #1a1a1a;">Détail des Factures</h2>
        <table>
            <thead>
                <tr>
                    <th>ID Facture</th>
                    <th>Élève</th>
                    <th>Classe</th>
                    <th>École</th>
                    <th>Offre</th>
                    <th>Date</th>
                    <th>Gains</th>
                    <th>Mois</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($invoices as $invoice)
                    @php
                        // Calculate teacher amount for this invoice
                        $teacherAmount = 0;
                        $monthsCount = 0;
                        
                        if ($invoice->membership && is_array($invoice->membership->teachers)) {
                            foreach ($invoice->membership->teachers as $teacherData) {
                                if (isset($teacherData['subject'])) {
                                    $offer = $invoice->offer;
                                    $teacherSubject = $teacherData['subject'];
                                    
                                    if ($offer && $teacherSubject && is_array($offer->percentage)) {
                                        $teacherPercentage = $offer->percentage[$teacherSubject] ?? 0;
                                        $teacherAmount = $invoice->amountPaid * ($teacherPercentage / 100);
                                        
                                        $selectedMonths = $invoice->selected_months ?? [];
                                        if (is_string($selectedMonths)) {
                                            $selectedMonths = json_decode($selectedMonths, true) ?? [];
                                        }
                                        if (empty($selectedMonths)) {
                                            $selectedMonths = [$invoice->billDate ? $invoice->billDate->format('Y-m') : null];
                                        }
                                        $monthsCount = count($selectedMonths);
                                        break;
                                    }
                                }
                            }
                        }
                    @endphp
                    <tr>
                        <td>{{ $invoice->id }}</td>
                        <td>{{ $invoice->student->firstName ?? '' }} {{ $invoice->student->lastName ?? '' }}</td>
                        <td>{{ $invoice->student->class->name ?? '—' }}</td>
                        <td>{{ $invoice->student->school->name ?? '—' }}</td>
                        <td>{{ $invoice->offer->offer_name ?? '—' }}</td>
                        <td>{{ $invoice->billDate ? \Carbon\Carbon::parse($invoice->billDate)->format('d/m/Y') : '—' }}</td>
                        <td class="amount">{{ number_format($teacherAmount, 2) }} DH</td>
                        <td class="months">{{ $monthsCount }} mois</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Pied de page -->
        <div class="footer">
            <p>Ce rapport a été généré automatiquement par le système de gestion scolaire.</p>
            <p>Pour toute question, veuillez contacter l'administration.</p>
        </div>
    </div>
</body>
</html> 