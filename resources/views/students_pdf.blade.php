<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Informations sur l'élève PDF</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th, td { border: 1px solid #333; padding: 8px; text-align: left; }
        th { background: #f0f0f0; }
        h2 { margin-bottom: 0; }
    </style>
</head>
<body>
    <div style="text-align:center; margin-bottom: 12px;">
        <img src="{{ public_path('logo.png') }}" alt="Logo" style="height: 80px; margin-bottom: 8px;">
    </div>
    <h2 style="text-align:center; color:#2d6cdf; margin-top:0;">Informations sur l'élève</h2>
    <table>
        <tr>
            <th>Nom</th>
            <td>{{ $student->firstName }} {{ $student->lastName }}</td>
        </tr>
        <tr>
            <th>Date de naissance</th>
            <td>{{ $student->dateOfBirth }}</td>
        </tr>
        <tr>
            <th>Email</th>
            <td>{{ $student->email }}</td>
        </tr>
        <tr>
            <th>Numéro de téléphone</th>
            <td>{{ $student->phoneNumber }}</td>
        </tr>
        <tr>
            <th>Adresse</th>
            <td>{{ $student->address }}</td>
        </tr>
        <tr>
            <th>Numéro du tuteur</th>
            <td>{{ $student->guardianNumber }}</td>
        </tr>
        <tr>
            <th>Code Massar</th>
            <td>{{ $student->massarCode }}</td>
        </tr>
        <tr>
            <th>Niveau</th>
            <td>{{ optional($student->level)->name }}</td>
        </tr>
        <tr>
            <th>Classe</th>
            <td>{{ optional($student->class)->name }}</td>
        </tr>
        <tr>
            <th>École</th>
            <td>{{ optional($student->school)->name }}</td>
        </tr>
    </table>
    <h3 style="margin-top:32px; color:#2d6cdf;">Adhésions</h3>
    <table>
        <thead>
            <tr>
                <th>Offre</th>
                <th>Statut</th>
                <th>Date de début</th>
                <th>Date de fin</th>
            </tr>
        </thead>
        <tbody>
            @foreach($student->memberships as $membership)
            <tr>
                <td>{{ optional($membership->offer)->offer_name ?? 'N/A' }}</td>
                <td>{{ ucfirst($membership->payment_status) }}</td>
                <td>{{ $membership->start_date }}</td>
                <td>{{ $membership->end_date }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
