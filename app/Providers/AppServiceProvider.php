<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Validator;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        
        // Fix for the "validateRequire" error - redirect "require" to "required"
        Validator::extend('require', function ($attribute, $value, $parameters, $validator) {
            // Just call the built-in required validator
            $required = $validator->validateRequired($attribute, $value);
            return $required;
        });
    }
}
