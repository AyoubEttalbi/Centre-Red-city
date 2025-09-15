<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Offer;


class OfferSeeder extends Seeder
{
    public function run()
    {
        // Offer::create([
        //     'offer_name' => 'Match & Pc',
        //     'price' => 500,
        //     'levelId' => 1,
        //     'subjects' => ['Math', 'Physics'],
        //     'percentage' => [
        //         'Math' => 15,
        //         'Physics' => 23,
        //     ],
        // ]);
        Offer::factory(50)->create();
    }
}
