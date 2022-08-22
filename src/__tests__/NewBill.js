/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
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
    });

    describe("When I choose a good extension (jpeg, jpg, png) file to upload", () => {
      test("Then the file will pass and the name will be found with good extension", async () => {
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
        await userEvent.upload(inputFile, file);

        expect(inputFile.files[0].name).toBe("image.jpg");
        expect(handleChangeFile).toBeCalled();
        expect(newBill.validFile).toBeTruthy();
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

        expect(inputFile.files[0].name).not.toBe("test.png");
        expect(handleChangeFile).toBeCalled();
        expect(newBill.validFile).toBeFalsy();
        expect(
          screen.getByTestId("error-file-extension").classList
        ).toBeTruthy();
      });
    });
  });

  // test d'intégration POST
  describe('When I am on NewBills page and I click on button "Envoyer"', () => {
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
    describe("When I fill form in correct format", () => {
      test("Then I should create a NewBill", async () => {
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

        // Define inputs values
        const inputData = {
          type: "Transports",
          name: "Voyage Paris Nice",
          amount: "174",
          date: "2022-08-22",
          vat: 70,
          pct: 20,
          file: new File(["img"], "image.png", { type: "image/png" }),
          commentary: "dummy test",
          status: "pending",
        };

        // Load the values in fields
        screen.getByTestId("expense-type").value = inputData.type;
        screen.getByTestId("expense-name").value = inputData.name;
        screen.getByTestId("amount").value = inputData.amount;
        screen.getByTestId("datepicker").value = inputData.date;
        screen.getByTestId("vat").value = inputData.vat;
        screen.getByTestId("pct").value = inputData.pct;
        screen.getByTestId("commentary").value = inputData.commentary;

        const inputFile = screen.getByTestId("file");

        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        const form = screen.getByTestId("form-new-bill");
        form.addEventListener("submit", handleSubmit);

        await userEvent.upload(inputFile, inputData.file);

        fireEvent.submit(form);

        expect(handleSubmit).toHaveBeenCalled();
      });

      test("Then it should render Bills page", () => {
        expect(screen.getByTestId("btn-new-bill")).toBeTruthy();
        expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      });
      
      describe("When an error occurs on API", () => {
        test("Then it should fetches messages from an API and fails with 500 message error", async () => {
          jest.spyOn(mockStore, "bills");
          mockStore.bills.mockImplementationOnce(() => {
            return {
              list: () => {
                return Promise.reject(new Error("Erreur 500"));
              },
            };
          });

          window.onNavigate(ROUTES_PATH.Bills);
          await new Promise(process.nextTick);
          const message = await screen.getByText(/Erreur 500/);
          expect(message).toBeTruthy();
        });
      });
    });
  });
});
