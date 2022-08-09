/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  /* Création de test pour le loading et la page d'erreur */
  describe("When I am on Bills page but it is loading", () => {
    test("Then, Loading page should be rendered", () => {
      document.body.innerHTML = BillsUI({ loading: true });
      expect(screen.getAllByText("Loading...")).toBeTruthy();
    });
  });
  describe("When I am on Bills page but back-end send an error message", () => {
    test("Then, Error page should be rendered", () => {
      document.body.innerHTML = BillsUI({ error: "some error message" });
      expect(screen.getAllByText("Erreur")).toBeTruthy();
    });
  });


  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
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
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });
    test("Then bills should be ordered from earliest to latest", () => {
      /* Correction du tri de dates */
      document.body.innerHTML = BillsUI({
        data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)),
      });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });

  /* Création de test le modal lorsque l'oeil est appuyé */
  describe("When I am on Bills page and I click on the icon eye", () => {
    test("Then a modal should open", async () => {
      //mock function modal (crée une fausse fonction)
      $.fn.modal = jest.fn();

      //création d'un local storage factice avant de lui assigner le type d'utilisateur
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      //initialise le dom 
      document.body.innerHTML = BillsUI({
        data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)),
      });

      //initialiser la page employé
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      //initie le store
      const store = null;

      // génère un exemple de nouvelle facture
      const billsContainer = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Retrouve l'icon pour ouvrir le modale
      const iconEye = screen.getAllByTestId("icon-eye")[0];

      //mock handleClickIconEye
      const handleClickIconEye = jest.fn(
        billsContainer.handleClickIconEye(iconEye)
      );

      //Joue le clique
      iconEye.addEventListener("click", handleClickIconEye);
      userEvent.click(iconEye);

      //on attend à ce que la fonction soit appelé
      expect(handleClickIconEye).toHaveBeenCalled();

      // on retrouve la modale avec son data-testid
      const modale = screen.getByTestId("modaleFileEmployee");
      expect(modale).toBeTruthy();
    });
  });

  /* Création de test pour le clique sur le boutton nouvelle note de frais */
  describe('When I am on Bills page and i click on the button "nouvelle note de frais"', () => {
    test("Then form new bill appears", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      //initie le store
      const store = null;

      // génère un exemple de nouvelle facture
      const billsContainer = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });
      document.body.innerHTML = BillsUI({
        data: [],
      });

      //mock handleClickIconEye
      const handleClickNewBill = jest.fn(billsContainer.handleClickNewBill);

      const newBill = screen.getByTestId("btn-new-bill");

      //Joue le clique
      newBill.addEventListener("click", handleClickNewBill);
      userEvent.click(newBill);

      //on attend à ce que la fonction soit appelé
      expect(handleClickNewBill).toHaveBeenCalled();

      // on retrouve la modale avec son data-testid
      const titleForm = screen.getByText("Envoyer une note de frais");
      expect(titleForm).toBeTruthy();
    });
  });
});

//  test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      //Attend de voir affiché le text Mes notes de frais
      await waitFor(() => screen.getByText("Mes notes de frais"));

      // recherche le tbody avant de vérifier qu'il existe bien
      const tbody = await screen.getByTestId("tbody");
      expect(tbody).toBeTruthy();

      // recherche le buttonNewBill avant de vérifier qu'il existe bien
      const buttonNewBill = await screen.getAllByTestId("btn-new-bill");
      expect(buttonNewBill).toBeTruthy();
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
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
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
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
