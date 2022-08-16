/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import mockStore from "../__mocks__/store";
import { localStorageMock } from "../__mocks__/localStorage.js";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
    });
    test("Then new bill icon in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");
      expect(mailIcon.classList.contains("active-icon")).toBeTruthy();
    });
    test("Then it should renders NewBills page", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const contentTitle = screen.getAllByText("Envoyer une note de frais");
      expect(contentTitle).toBeTruthy();
    });
  });

  describe('When I am on NewBills page and I click on button "Choose file"', () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
    })

    describe("When I choose a good extension (jpeg, jpg, png) file to upload", () => {
      test('Then the file will pass and the name will be found with good extension', async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const html = NewBillUI();
        document.body.innerHTML = html;

        //initie le store
        const store = mockStore;

        //Initie newBill
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });

        //mock la fonction contenu dans newbill
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));

        const file = new File(["image"], "image.jpg", { type: "image/jpeg" });

        //retrouve l'élément dans le dom et met un evenement dessus
        const inputFile = screen.getByTestId("file");
        inputFile.addEventListener("change", handleChangeFile);

        //simule le choix d'un fichier
        await userEvent.upload(inputFile, file)

        expect(handleChangeFile).toBeCalled();
        expect(newBill.validFile).toBeTruthy();
        expect(inputFile.files[0].name).toBe("image.jpg");
      });
    });
    describe("When I choose a wrong extension file to upload", () => {
      test("Then an error message is displayed", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        const html = NewBillUI();
        document.body.innerHTML = html;

        //initie le store
        const store = mockStore;

        //Initie newBill
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });

        //mock la fonction contenu dans newbill
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));

        const file = new File(["test"], "test.gif", { type: "image/gif" });

        //retrouve l'élément dans le dom et met un evenement dessus
        const inputFile = screen.getByTestId("file");
        inputFile.addEventListener("change", handleChangeFile);

        //simule le choix d'un fichier
        await userEvent.upload(inputFile, file);

        expect(handleChangeFile).toBeCalled();
        expect(newBill.validFile).not.toBeTruthy();
        expect(inputFile.files[0].name).not.toBe("test.png");
        expect(
          screen.getByTestId("error-file-extension").classList
        ).toBeTruthy();
      });
    });
  });

  describe('When I am on NewBills page and I click on button "Envoyer"', () => {
    describe("When I fill form in correct format", () => {
      test("Then an HTML error should appears", () => {});
    });
    describe("When I fill form in incorrect format", () => {
      test("Then I should create a NewBill", () => {});
    });
  });
});
