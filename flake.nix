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
            ];
            shellHook = ''
              export PATH="$PWD/node_modules/.bin/:$PATH"
            '';
          };
        }
      );
}
