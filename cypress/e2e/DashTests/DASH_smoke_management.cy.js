describe("DASH smoke tests/Managements", 
//set enviroment variables for test suite
{
  env: {
    req_timeout: 30000,
    elem_timeout: 30000,
   // password: 'global'
  },
},
() => 
{ 
  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  } 
  const normalizeText = (s) => s.replace(/\s/g, '').toLowerCase()
  beforeEach(() => {
      cy.visit(Cypress.env('url_g'))
      cy.get('#UserName').type(Cypress.env('login_g'))
      cy.get('#Password').type(Cypress.env('password_g'))
      cy.contains('Log in').click()
      cy.get(".header-banner__close-button",{setTimeout: 40000}).click()
    })
    context("Manage Shows", ()=>{
      beforeEach(() => {
        cy.xpath("//div[normalize-space(text()) = 'Manage Shows']").click()
        cy.url().should('include', '/ones/new/shows')
      }) 
     it("Can open Manage Shows", () => {
       cy.get('.show__content').eq(0).should("exist") //waits the grid is loaded
       cy.get('body').then(($body) => {   
          if ($body.find('.show__content',{setTimeout: `${Cypress.env('elem_timeout')}`}).length>1){ //check if any show exists
            cy.contains(".status__label","Active").eq(0).should("exist")
            //Inactive Shows counter=0
            cy.contains(".counters__item","Inactive").find("span").should(($counter) => {
              expect(normalizeText($counter.text()), 'Count of Inactive Shows is zero by default').to.equal("0")
            })
            //Delivered Shows counter=0
            cy.contains(".counters__item","Delivered").find("span").should(($counter) => {
              expect(normalizeText($counter.text()),'Count of Delivered Shows is zero by default').to.equal("0")
            })
            cy.log($body.find('.show__content').length)
          }
          else{
            cy.log("There are NO shows.")
          }
        })
        cy.contains('.VButton__text',"Apply").click() //click Apply to initiate response
        cy.intercept('/api/Shows/Search').as('grid_list')
        cy.wait('@grid_list',{requestTimeout:`${Cypress.env('req_timeout')}`}).then(({response}) => {
            expect(response.statusCode).to.eq(200)
            expect(JSON.stringify(response.body), 'There are no inactive shows in response by deafult').to.not.contain('Inactive')
            expect(JSON.stringify(response.body),'There are no delivered shows in response by deafult').to.not.contain('Delivered')
            let show_count=response.body.items.length
            let FirstName
            if(show_count>0){
            FirstName=response.body.items[0].showCode
            cy.get(".show__content",{setTimeout: `${Cypress.env('elem_timeout')}`}).eq(0).should("exist")
            cy.contains(".info__title",FirstName).eq(0).should("exist") //check if 1-st show exists and matches response
            //active Shows UI counter displays correct value, similar to response count
            cy.contains(".counters__item","Active").find("span").should(($counter) => {
              expect(parseInt(normalizeText($counter.text())),'Count of Active Shows corresponds to BE response').to.equal(show_count)
            })
            cy.log("The show is - "+FirstName)
            cy.contains(".VButton__text","Create New Show").should("exist") //create button exists
            }
            cy.log("The number of shows came from BE - "+show_count)
          })

      })
      it("Manage Shows=> search and filters work", () => {
        cy.contains('.v-filter__placeholder', 'Active').click()
        cy.contains('label','Active').click()
        let filter_status=['Delivered', 'Inactive']
        let status=filter_status[getRandomInt(2)] //selects random status to filter
        cy.contains('label',status).click()
        cy.contains('.VButton__text',"Apply").click()         
        cy.intercept('/api/Shows/Search').as('grid_list')
        cy.wait('@grid_list',{requestTimeout:`${Cypress.env('req_timeout')}`}).then(({response}) => {
            expect(response.statusCode).to.eq(200)
            let show_count=response.body.items.length
            let RandomIndex=getRandomInt(show_count)
            cy.log(RandomIndex)
            let RandomName
            if(show_count>0){
            expect(response.body.items[RandomIndex].showStatus, 'Random Show status corresponds to filtered one').to.equal(status)
            RandomName=response.body.items[RandomIndex].showCode //store random show code came in BE response
            //filtered Shows UI counter displays correct value, similar to response count
            cy.contains(".counters__item",status).find("span").should(($counter) => {
              expect(parseInt(normalizeText($counter.text())),'Count of '+status+ ' Shows corresponds to BE response').to.equal(show_count)
            })         
            cy.get('.search__input').type(RandomName) //initiate searching of this Show Code on UI
            cy.contains('.VButton__text',"Apply").click()
            cy.contains(".info__title",RandomName,{setTimeout: `${Cypress.env('elem_timeout')}`}).eq(0).should("exist") //check if the searched Show exists
            cy.log("The show is - "+RandomName)
            //Active Shows counter=0
            cy.contains(".counters__item","Active").find("span").should(($counter) => {
              expect(normalizeText($counter.text()), 'Count of Active Shows is zero').to.equal("0")
            })          
          
            }
            cy.log("The number of shows came from BE - "+show_count)
          })

      })
                
       
    })
    context("Manage Shows => Navigation links", ()=>{
      beforeEach(() => {
        cy.xpath("//div[normalize-space(text()) = 'Manage Shows']").click()
        cy.url().should('include', '/ones/new/shows')
      }) 
     it("Manage Shows=> Manage link", () => {
        let show_number
        cy.contains('.actions__item','Manage').eq(0).should("exist") //waits the grid is loaded
        cy.get('.show__content',{setTimeout: `${Cypress.env('elem_timeout')}`}).then(($body) => {   
           if ($body.length>1){ //check if any show exists
              show_number=getRandomInt($body.length)
              cy.get('.show__info').eq(show_number).find('div').eq(0).then(($code)=>{
                let codeUI=$code.text().trim()
                cy.intercept('GET', '**/api/ManageShowsApi/GetManageShow*').as('grid_list')
                cy.get('.show__content').eq(show_number).find('.actions__item').eq(0).should("exist").click() //click Manage
                cy.wait('@grid_list',{requestTimeout:`${Cypress.env('req_timeout')}`}).then(({response}) => {
                  expect(response.statusCode).to.eq(200)
                  let ShowCode=response.body.show.code
                  cy.log('Show number= '+show_number)
                  cy.url().should('include', '/ones/shows/add-edit')
                  cy.title().should('include', 'Edit Show - '+Cypress.env("bu"))
                  cy.contains('.section__block_title','Show Details').should('exist')
                  expect(codeUI).to.include(ShowCode)
                })
              })
           }
           else{
             cy.log("There are NO shows.")
           }
         })
          
       })  
       
       it("Manage Shows=> Ones link", () => {
        let show_number
        cy.contains('.actions__item','Ones').eq(0).should("exist") //waits the grid is loaded
        cy.get('.show__content',{setTimeout: `${Cypress.env('elem_timeout')}`}).then(($body) => {   
           if ($body.length>1){ //check if any show exists
              show_number=getRandomInt($body.length)
              cy.get('.show__info').eq(show_number).find('div').eq(0).then(($code)=>{
                let codeUI=$code.text().trim()
                cy.get('.show__content').eq(show_number).find('.actions__item').eq(2).should("exist").click()  
                cy.log('Show number= '+show_number)
                cy.log('Show code= '+codeUI)
                cy.url().should('include', '/ones/show/')
                cy.title().should('include', 'Show Ones -')
                cy.contains('.btn__overflow','|').should('exist').then(($code)=>{
                  let code_long=$code.text().trim()
                  const re = /[|]/;
                  let ShowCode=code_long.substring(0,code_long.search(re)).trim()
                  cy.log('Show Ones, Show Code= '+ShowCode)
                  expect(codeUI).to.include(ShowCode) //verify Show code cliked in Manage shows corresponds to loaded in Ones
                  })
                  cy.get('.item__info__department').should('exist')
              })
           }
           else{
             cy.log("There are NO shows.")
           }
         })
          
       })  
       it("Manage Shows=> Financials link", () => {
        let show_number
        cy.contains('.actions__item','Financials').eq(0).should("exist") //waits the grid is loaded
        cy.get('.show__content',{setTimeout: `${Cypress.env('elem_timeout')}`}).then(($body) => {   
           if ($body.length>1){ //check if any show exists
              show_number=getRandomInt($body.length)
              cy.get('.show__content').eq(show_number).find('.actions__item').eq(3).should("exist").click()             
                  cy.log('Show number= '+show_number)
                  cy.contains('.VButton__text','Print',{setTimeout: `${Cypress.env('elem_timeout')}`}).should('exist')  
                  cy.url().should('include', 'ones/shows/financials')
                  cy.title().should('include', 'Financials - '+Cypress.env("bu")) 
           }
           else{
             cy.log("There are NO shows.")
           }
         })
          
       })    
      it("Manage Shows=> Publish archive link", () => {
        let show_number
        cy.contains('.actions__item','Publish Archive').eq(0).should("exist") //waits the grid is loaded
        cy.get('.show__content',{setTimeout: `${Cypress.env('elem_timeout')}`}).then(($body) => {   
           if ($body.length>1){ //check if any show exists
              show_number=getRandomInt($body.length)
              cy.get('.show__content').eq(show_number).find('.actions__item').eq(4).should("exist").click()             
                  cy.log('Show number= '+show_number)
                  cy.contains('.btn-content','Back to All Shows',{setTimeout: `${Cypress.env('elem_timeout')}`}).should('exist')  
                  cy.url().should('include', 'ones/shows/publish-archive')
                  cy.title().should('include', 'Publish Archive - '+Cypress.env("bu")) 
           }
           else{
             cy.log("There are NO shows.")
           }
         })
          
       })  
       it("Manage Shows=> Show Planner link", () => {
        let show_number
        cy.contains('.actions__item','Show Planner').eq(0).should("exist") //waits the grid is loaded
        cy.get('.show__content',{setTimeout: `${Cypress.env('elem_timeout')}`}).then(($body) => {   
           if ($body.length>1){ //check if any show exists
              show_number=getRandomInt($body.length)
              cy.get('.show__content').eq(show_number).find('.actions__item').eq(1).should("exist").click() //show planner       
                  cy.log('Show number= '+show_number)
                  cy.get('#btSim',{setTimeout: `${Cypress.env('elem_timeout')}`}).should('exist')  
                  cy.url().should('include', 'ones/shows/showplanner')
                  cy.title().should('include', 'Show Planner - '+Cypress.env("bu"))
                  
           }
           else{
             cy.log("There are NO shows.")
           }
         })
          
       })  
    })
    context("Create new Show", ()=>{
     it("Create new Show page", () => {
        cy.xpath("//div[normalize-space(text()) = 'Create New Show']").click()
        cy.url().should('include', '/ones/shows/add-edit')
        cy.contains('.section__block_title','Show Details').should('exist') //check if Show Details block exists
        cy.contains('.section__block_title','Key Dates').should('exist') //check if Key Dates block exists
        cy.contains('.section__block_title','Seniority Splits').should('exist') //etc.
        cy.contains('.section__block_title','Financial').should('exist') //etc.
        cy.contains('.section__block_title','Locations').should('exist') //etc.
        //primary location
        cy.contains("Primary").next(".input-group__input").should("exist").click()
        cy.xpath("//a[contains(text(), 'London')]").eq(0).click()
        //secondary location
        cy.contains("Secondary").next(".input-group__input").should("exist").click()
        cy.get('ul').find('label').eq(0).click()
        cy.contains('span', 'Show Inputs').click()
        cy.contains('.section__block_title','Exchange Rates').should('exist') //Exchange Rates
        cy.contains('.section__block_title','Rate Cards').should('exist') 
        cy.contains('span', 'Avg Artist Day Rates').click()
        cy.contains('.navigation__button', 'London').click() //check is site tab exists
        cy.contains('.cell', 'Assets').should('exist')
        cy.contains('.navigation__button', 'London').siblings().click() //checks is the second site exists
        cy.contains('.cell', 'Assets').should('exist')
        cy.contains('span', 'Outsource Rates').click()
        cy.contains('.navigation__tabName', Cypress.env('bu')).should('exist')
        cy.contains('.cell', 'Assets').should('exist')
        cy.contains('span', 'Bid Weeks').click()
        cy.contains('Please, create new show').should('exist')
        cy.contains('span', 'Contract Value').click()
        cy.contains('.cell', 'London').should('exist')
        cy.contains('.navigation__button', 'Adjustments').should('exist')
        cy.contains('span', 'Add Row').should('exist')
        cy.contains('span', 'Indirect Costs').click()
        cy.contains('Please, create new show').should('exist')
        cy.contains('span', 'Internal Bid').click()
        cy.contains('.cell', 'London').should('exist')
        cy.contains('.cell', 'Award Revenue').should('exist')
        cy.contains('.VButton__text', 'Create show').should('exist')
        cy.contains('.VButton__text', 'Cancel').click()
        cy.url().should('include', '/ones/new/shows')
      })  
      it("Manage Shows => Create new Show page (on button click)", () => {
        cy.xpath("//div[normalize-space(text()) = 'Manage Shows']").click()
        cy.url().should('include', '/ones/new/shows')
        cy.contains('.VButton__text','Create New Show').click()
        cy.url().should('include', '/ones/shows/add-edit')
        cy.contains('.section__block_title','Show Details').should('exist') //check if Show Details block exists
        //check all tabs exist
        cy.contains('span', 'Show Stats').should('exist')
        cy.contains('span', 'Show Inputs').should('exist')
        cy.contains('span', 'Avg Artist Day Rates').should('exist')
        cy.contains('span', 'Outsource Rates').should('exist')
        cy.contains('span', 'Bid Weeks').should('exist')
        cy.contains('span', 'Contract Value').should('exist')
        cy.contains('span', 'Indirect Costs').should('exist')
        cy.contains('span', 'Internal Bid').should('exist')
        //check back button navigates to Manage Shows
        cy.contains('.buttons__back_text', 'Back').click()
        cy.url().should('include', '/ones/new/shows')
      })   
       
    })
    context("Manage Projects", ()=>{
      beforeEach(() => {
        cy.xpath("//div[normalize-space(text()) = 'Manage Projects']").click()
        cy.url().should('include', '/ones/projects/')
      }) 
     it("Can open Manage Projects", () => {
       cy.get('.project__content').eq(0).should("exist") //waits the grid is loaded
       cy.get('body').then(($body) => {   
          if ($body.find('.project__content',{setTimeout: `${Cypress.env('elem_timeout')}`}).length>1){ //check if any show exists
            cy.contains(".actions__item","Summary").eq(0).should("exist")
            cy.log($body.find('.project__content').length)
          }
          else{
            cy.log("There are NO projects.")
          }
        })
        cy.intercept('/api/Projects/Search').as('grid_list')
        cy.contains('.VButton__text',"Apply").click() //click Apply to initiate response
        
        cy.wait('@grid_list',{requestTimeout:`${Cypress.env('req_timeout')}`}).then(({response}) => {
            expect(response.statusCode).to.eq(200)
            let project_count=response.body.items.length
            let FirstName
            if(project_count>0){
            FirstName=response.body.items[0].showCode
            cy.get(".project__content",{setTimeout: `${Cypress.env('elem_timeout')}`}).eq(0).should("exist")
            cy.contains(".info__title",FirstName).eq(0).should("exist") //check if 1-st show exists and matches response
            //active Shows UI counter displays correct value, similar to response count
            cy.contains(".counters__item","Active").find("span").then(($counterA) => {
              cy.contains(".counters__item","Inactive").find("span").then(($counterI) => {
                cy.contains(".counters__item","Delivered").find("span").then(($counterD) => {
                expect(parseInt(normalizeText($counterA.text()))+parseInt(normalizeText($counterI.text()))+parseInt(normalizeText($counterD.text())),'Count of Active&Inactive&Delivered Shows corresponds to total shows in BE response').to.equal(project_count)
                cy.log(parseInt(normalizeText($counterA.text()))+parseInt(normalizeText($counterI.text()))+parseInt(normalizeText($counterD.text())))
                })
            })
            })
            cy.log("The project is - "+FirstName)
            }
            cy.log("The number of projects came from BE - "+project_count)
          })

      })
      it("Manage Projects=> search and filters work", () => {
        cy.contains('.v-filter__placeholder', 'Active, Inactive, Delivered').click()
        cy.get('.header__control').eq(3).find('li').eq(0).click()
        let filter_status=['Active','Inactive','Delivered']
        let status=filter_status[getRandomInt(3)] //selects random status to filter
        cy.contains('label',status).click()
        cy.intercept('/api/Projects/Search').as('grid_list')
        cy.contains('.VButton__text',"Apply").click()         
        cy.wait('@grid_list',{requestTimeout:`${Cypress.env('req_timeout')}`}).then(({response}) => {
            expect(response.statusCode).to.eq(200)
            let project_count=response.body.items.length
            let RandomIndex=getRandomInt(project_count)
            cy.log(RandomIndex)
            let RandomName
            if(project_count>0){
            expect(response.body.items[RandomIndex].showStatus, 'Random Project status corresponds to filtered one').to.equal(status)
            RandomName=response.body.items[RandomIndex].showCode //store random show code came in BE response
            //filtered Project UI counter displays correct value, similar to response count
            cy.contains(".counters__item",status).find("span").should(($counter) => {
              expect(parseInt(normalizeText($counter.text())),'Count of '+status+ ' Projects corresponds to BE response').to.equal(project_count)
            })             
            cy.get('.search__input').type(RandomName) //initiate searching of this Show Code on UI
            cy.contains('.VButton__text',"Apply").click()
            cy.contains(".info__title",RandomName,{setTimeout: `${Cypress.env('elem_timeout')}`}).eq(0).should("exist") //check if the searched Show exists
            cy.log("The show is - "+RandomName) 
          
            }
            cy.log("The number of projects came from BE - "+project_count)
          })

      })
        
    })
    context("Manage Projects => Navigation links", ()=>{
      beforeEach(() => {
        cy.xpath("//div[normalize-space(text()) = 'Manage Projects']").click()
        cy.url().should('include', '/ones/projects')
      })
      it("Manage Projects=> Summary link", () => {
        let project_number
        cy.contains('.actions__item','Summary').eq(0).should("exist") //waits the grid is loaded
        cy.get('.project__content',{setTimeout: `${Cypress.env('elem_timeout')}`}).then(($body) => {   
           if ($body.length>1){ //check if any show exists
              project_number=getRandomInt($body.length)
              cy.get('.project__info').eq(project_number).find('div').eq(0).then(($code)=>{
                let codeUI=$code.text().trim()
                cy.intercept('GET', '**/api/ProjectApi/GetDataForProjectCreation*').as('grid_list')
                cy.get('.project__content').eq(project_number).find('.actions__item').eq(0).should("exist").click() //click Summary
                cy.wait('@grid_list',{requestTimeout:`${Cypress.env('req_timeout')}`}).then(({response}) => {
                  expect(response.statusCode).to.eq(200)
                  let ProjectCode=response.body.project.code
                  let ProjectId=response.body.project.id
                  cy.log('Project number= '+project_number)
                  cy.url().should('include', '/ones/projects/?projectId='+ProjectId+'&isSummaryView=true')
                  cy.title().should('include', 'Edit Project')
                  cy.contains('.summary-table__header','project details').should('exist')
                  expect(codeUI).to.include(ProjectCode)
                })
              })
           }
           else{
             cy.log("There are NO projects.")
           }
         }) 
      })    
      it("Manage Projects=> Manage link", () => {
        let project_number
        cy.contains('.actions__item','Manage').eq(0).should("exist") //waits the grid is loaded
        cy.get('.project__content',{setTimeout: `${Cypress.env('elem_timeout')}`}).then(($body) => {   
           if ($body.length>1){ //check if any show exists
              project_number=getRandomInt($body.length)
              cy.get('.project__info').eq(project_number).find('div').eq(0).then(($code)=>{
                let codeUI=$code.text().trim()
                cy.intercept('GET', '**/api/ProjectApi/GetDataForProjectCreation?projectId*').as('grid_list')
                cy.get('.project__content').eq(project_number).find('.actions__item').eq(1).should("exist").click() //click Manage
                cy.wait('@grid_list',{requestTimeout:`${Cypress.env('req_timeout')}`}).then(({response}) => {
                  expect(response.statusCode).to.eq(200)
                  let ProjectCode=response.body.project.code
                  let ProjectId=response.body.project.id
                  cy.log('Project number= '+project_number)
                  cy.url().should('include', '/ones/projects/?projectId='+ProjectId+'&isSummaryView=false')
                  cy.title().should('include', 'Edit Project')
                  cy.contains('.row__title','Project Details').should('exist')
                  expect(codeUI).to.include(ProjectCode)
                })
              })
           }
           else{
             cy.log("There are NO projects.")
           }
         })
          
       })  
                 
       })  
    context("Create new Project", ()=>{
      it("Create new Project page", () => {
         cy.xpath("//div[normalize-space(text()) = 'Create New Project']").click()
         cy.url().should('include', '/ones/projects/?isCreateMode=true')
         cy.contains('.row__title','Project Details').should('exist') //check if Show Details block exists and others
         cy.contains('.row__title','Key Dates').should('exist')
         cy.contains('.row__title','Seniority Splits').should('exist')
         cy.contains('.row__title','Locations').should('exist')
         cy.contains('.row__title','Project Manager').should('exist')
         cy.contains('.row__title','Additional info').should('exist')
         cy.contains('.row__title','Created').should('exist')
         cy.contains('.row__title','Updated').should('exist')
         cy.contains('.VButton__text', 'Save').should('exist')
         cy.contains('.VButton__text', 'Delete').parent().should('have.attr', 'disabled')
         cy.contains('.VButton__text', 'Cancel').click()
         cy.url().should('include', '/ones/projects/')
       })  
       it("Manage Projects => Create new Projects page (on button click)", () => {
         cy.xpath("//div[normalize-space(text()) = 'Manage Projects']").click()
         cy.url().should('include', '/ones/projects/')
         cy.get('.VButton-theme_default-blue').click()
         cy.url().should('include', '/ones/projects/?isCreateMode=true')
         cy.contains('.row__title','Project Details').should('exist') //check if Show Details block exists and others
         cy.contains('.row__title','Key Dates').should('exist')
         cy.contains('.row__title','Seniority Splits').should('exist')
         cy.contains('.row__title','Locations').should('exist')
         cy.contains('.row__title','Project Manager').should('exist')
         cy.contains('.row__title','Additional info').should('exist')
         cy.contains('.row__title','Created').should('exist')
         cy.contains('.row__title','Updated').should('exist')
         cy.contains('.VButton__text', 'Save').should('exist')
         cy.contains('.VButton__text', 'Delete').parent().should('have.attr', 'disabled')
         cy.contains('.VButton__text', 'Cancel').should('exist')
         cy.contains('.VButton__text', 'Back').click()
         cy.url().should('include', '/ones/projects/')
       })   
        
     })

    })
    export{}