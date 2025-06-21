{
  description = "";

  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem
      (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          devShells.default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs
              nodePackages."typescript-language-server"

              # Python for http server `python3 -m http.server`
              (pkgs.python3.withPackages (python-pkgs: with python-pkgs; [
                # lsp related (uncomment if you want it)
                #python-lsp-server
                #rope # autocomplete
                #pyflakes # syntax checking
                #pycodestyle # style linting
                #pylsp-mypy # type checking
                #future # solves https://github.com/tomv564/pyls-mypy/issues/37
              ]))
            ];
          };
        }
      );
}
