import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-service-problems',
  templateUrl: './serviceProblems.component.html',
  styleUrls: ['./serviceProblems.component.css']
})
export class ServiceProblemsComponent implements OnInit {
  displayProblems: Boolean = true;
  serviceProblems: any[] = [];

  constructor() { }

  ngOnInit() {
  }

  btnServiceProblemsDetail(event: any): void {
    this.showPanel();
  }

  private showPanel( ): void {
    this.displayProblems = !this.displayProblems;
  }

}
