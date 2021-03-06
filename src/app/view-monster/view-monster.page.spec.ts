import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { By } from '@angular/platform-browser';
import { of, throwError, never } from 'rxjs';

import { MonsterDataService } from './../services/monster-data.service';
import { ViewMonsterPage } from './view-monster.page';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

const thrownError = new HttpErrorResponse({
  status: 0, 
  statusText: "Fake Error"
});

class MockMonsterDataService {
  loadMonster(id: number) {
    if (id != 1) { 
      return throwError(thrownError);
    }
    return of({
      id: id, 
      name: "Alpha", 
      hitPointsAndDice: "4 (1d8)", 
      actions: [{
        name: "Slam",
        description: "Melee Weapon Attack: +2 to hit, reach 5ft., one target. Hit: 3 (1d6) bludgeoning damage."
      }]
    });
  }
}

describe('ViewMonsterPage', () => {
  let component: ViewMonsterPage;
  let fixture: ComponentFixture<ViewMonsterPage>;

  let idParam: number;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewMonsterPage ],
      imports: [IonicModule],
      providers: [
        { 
          provide: ActivatedRoute, 
          useValue: { paramMap: of({get: () => idParam}) } 
        },
        { 
          provide: MonsterDataService, 
          useClass: MockMonsterDataService 
        }
      ],
      schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewMonsterPage);
    component = fixture.componentInstance;
  });
  
  describe('before the server has responded', () => {
    beforeEach(() => {
      spyOn(component.monsterDataService, "loadMonster").and.returnValue(never());
      fixture.detectChanges();
    });

    it('should show that it is loading in the title', () => {
      let pageTitle = fixture.debugElement.query(By.css("ion-title")).nativeElement.innerHTML;
      expect(pageTitle).toContain("Loading...");
    });
  });

  describe('when an error occurs during the HTTP request', () => {
    beforeAll(() => idParam = -1);
    beforeEach(() => fixture.detectChanges());

    it('should show the error', () => {
      let pageTitle = fixture.debugElement.query(By.css("ion-title")).nativeElement.innerHTML;
      let pageContent = fixture.debugElement.query(By.css("ion-content")).nativeElement.innerHTML;

      expect(pageTitle).toContain("Fake Error");
      expect(pageContent).toContain("Http failure response");
      expect(pageContent).toContain("Fake Error");
    });
  });

  describe('when a monster with the specified ID is found', () => {
    beforeAll(() => idParam = 1);
    beforeEach(() => fixture.detectChanges());

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should show the monster\'s name as the page title', () => {
      let pageTitle = fixture.debugElement.query(By.css("ion-title")).nativeElement.innerHTML;
      expect(pageTitle).toContain("Alpha");
    });

    it('should show the monster\'s hit points', async () => {
      // Below is a convoluted mess. I haven't found out how to perform queries
      // that penetrate the shadow DOM, so for now we have to know exactly where
      // the shadow roots are, await their loading, and continue the search for
      // the values we actually want to test.

      let monsterElement = fixture.debugElement.query(By.css("vellum-monster")).nativeElement;
      await monsterElement.updateComplete;
      let statElement = monsterElement.shadowRoot.querySelector("vellum-stat[id='hp'");
      await statElement.updateComplete
      let statElementContent = statElement.shadowRoot.innerHTML

      expect(statElementContent).toContain("4 (1d8)");
    })

    it('should show the monster\'s damage', async () => {
      // Same as above, but a slightly different path through the DOM is taken.
      
      let monsterElement = fixture.debugElement.query(By.css("vellum-monster")).nativeElement;
      await monsterElement.updateComplete;
      let statElement = monsterElement.shadowRoot.querySelector("vellum-stat[name='Slam.']");
      await statElement.updateComplete;
      let statElementContent = statElement.shadowRoot.innerHTML

      expect(statElementContent).toContain("3 (1d6) bludgeoning damage"); // Damage
    });
  });
});
