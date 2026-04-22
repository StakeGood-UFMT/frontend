import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StellarService } from '@core/services/stellar.service';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UpperCasePipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private stellarService = inject(StellarService);
  
  public connectionStatus = this.stellarService.connectionStatus;
  public stellarNetwork = this.stellarService.getNetwork();
}
