describe("Home", () => {
  it("loads the home page and shows App da Pesca", () => {
    cy.visit("/");
    cy.contains("App da Pesca").should("be.visible");
    cy.contains("Ver catálogo").should("be.visible");
  });

  it("navigates to products from home", () => {
    cy.visit("/");
    cy.contains("Ver catálogo").click();
    cy.url().should("include", "/produtos");
  });
});
