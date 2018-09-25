pragma solidity ^0.4.25;
import "./mixins/RBACMixin.sol";
import "./mixins/RBACMintableTokenMixin.sol";
import "./mixins/RBACERC223TokenFinalization.sol";
import "zeppelin-solidity/contracts/token/ERC20/StandardBurnableToken.sol";


/// @title Rasmart Platform token implementation
/// @author Abha Mai <maiabha82@gmail.com>
/// @dev Implements ERC20, ERC223 and MintableToken interfaces as well as capped and finalization logic
contract RasmartToken is StandardBurnableToken, RBACERC223TokenFinalization, RBACMintableTokenMixin {
  /// @notice Constant field with token full name
  // solium-disable-next-line uppercase
  string constant public name = "RASMART"; 
  /// @notice Constant field with token symbol
  string constant public symbol = "RAS"; // solium-disable-line uppercase
  /// @notice Constant field with token precision depth
  uint256 constant public decimals = 18; // solium-disable-line uppercase
  /// @notice Constant field with token cap (total supply limit)
  uint256 constant public cap = 500 * (10 ** 6) * (10 ** decimals); // solium-disable-line uppercase

  /// @notice Overrides original mint function from MintableToken to limit minting over cap
  /// @param _to The address that will receive the minted tokens.
  /// @param _amount The amount of tokens to mint.
  /// @return A boolean that indicates if the operation was successful.
  function mint(
    address _to,
    uint256 _amount
  )
    public
    returns (bool) 
  {
    require(totalSupply().add(_amount) <= cap);
    return super.mint(_to, _amount);
  }

  /// @notice Overrides finalize function from RBACERC223TokenFinalization to prevent future minting after finalization
  /// @return A boolean that indicates if the operation was successful.
  function finalize() public returns (bool) {
    require(super.finalize());
    require(finishMinting());
    return true;
  }

  /// @notice Overrides finishMinting function from RBACMintableTokenMixin to prevent finishing minting before finalization
  /// @return A boolean that indicates if the operation was successful.
  function finishMinting() internal returns (bool) {
    require(finalized == true);
    require(super.finishMinting());
    return true;
  }
}
