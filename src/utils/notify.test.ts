import * as vscode from "vscode";
import {
  showInformationMessage,
  showWarningMessage,
  showErrorMessage,
  setStatusBarMessage,
} from "./notify";

jest.mock("vscode", () => ({
  window: {
    showInformationMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    setStatusBarMessage: jest.fn(() => ({ dispose: jest.fn() })),
  },
}));

const mockedVscode = jest.mocked(vscode);

describe("showInformationMessage", () => {
  it("should call vscode.window.showInformationMessage with prefixed message", () => {
    showInformationMessage("Test message");

    expect(mockedVscode.window.showInformationMessage).toHaveBeenCalledWith(
      "WhatKey => Test message",
    );
  });

  it("should handle empty message", () => {
    showInformationMessage("");

    expect(mockedVscode.window.showInformationMessage).toHaveBeenCalledWith(
      "WhatKey => ",
    );
  });
});

describe("showWarningMessage", () => {
  it("should call vscode.window.showWarningMessage with prefixed message", () => {
    showWarningMessage("Warning test");

    expect(mockedVscode.window.showWarningMessage).toHaveBeenCalledWith(
      "WhatKey => Warning test",
    );
  });

  it("should handle special characters in message", () => {
    showWarningMessage("Warning: file 'test.ts' not found!");

    expect(mockedVscode.window.showWarningMessage).toHaveBeenCalledWith(
      "WhatKey => Warning: file 'test.ts' not found!",
    );
  });
});

describe("showErrorMessage", () => {
  it("should call vscode.window.showErrorMessage with prefixed message", () => {
    showErrorMessage("Error occurred");

    expect(mockedVscode.window.showErrorMessage).toHaveBeenCalledWith(
      "WhatKey => Error occurred",
    );
  });

  it("should handle multiline message", () => {
    showErrorMessage("Line 1\nLine 2");

    expect(mockedVscode.window.showErrorMessage).toHaveBeenCalledWith(
      "WhatKey => Line 1\nLine 2",
    );
  });
});

describe("setStatusBarMessage", () => {
  it("should call vscode.window.setStatusBarMessage with prefixed message and no timeout", () => {
    setStatusBarMessage("Status update");

    expect(mockedVscode.window.setStatusBarMessage).toHaveBeenCalledWith(
      "WhatKey => Status update",
    );
  });

  it("should call vscode.window.setStatusBarMessage with prefixed message and timeout", () => {
    setStatusBarMessage("Temporary status", 3000);

    expect(mockedVscode.window.setStatusBarMessage).toHaveBeenCalledWith(
      "WhatKey => Temporary status",
      3000,
    );
  });

  it("should return the disposable from vscode", () => {
    const mockDisposable = { dispose: jest.fn() };
    mockedVscode.window.setStatusBarMessage.mockReturnValueOnce(mockDisposable);

    const disposable = setStatusBarMessage("Test");

    expect(disposable).toBe(mockDisposable);
  });

  it("should handle zero timeout", () => {
    setStatusBarMessage("Zero timeout", 0);

    expect(mockedVscode.window.setStatusBarMessage).toHaveBeenCalledWith(
      "WhatKey => Zero timeout",
      0,
    );
  });
});
