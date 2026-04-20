// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CommitCar
 * @author BlindspotLab · @mojeebeth
 * @notice ERC-721 for cars generated from GitHub commits at commitcar.vercel.app
 * @dev One mint per GitHub username. Free mint (user pays gas).
 *      Traits are derived off-chain and committed on-chain as a keccak hash
 *      so ownership is portable and verifiable.
 */
contract CommitCar is ERC721, Ownable {
    // ─── Storage ─────────────────────────────────────────────────────
    uint256 private _nextTokenId;

    /// @dev Maps lowercased github username to tokenId (0 = unminted)
    mapping(string => uint256) public tokenIdByUsername;

    /// @dev Maps tokenId to the github username
    mapping(uint256 => string) public usernameByTokenId;

    /// @dev Maps tokenId to the keccak256 of traits JSON (prevents tampering)
    mapping(uint256 => bytes32) public traitsHashOf;

    /// @dev Base URI for metadata (e.g. https://commitcar.vercel.app/api/metadata/)
    string private _baseTokenURI;

    /// @dev Per-token URI override (if set during mint)
    mapping(uint256 => string) private _tokenURIs;

    // ─── Events ──────────────────────────────────────────────────────
    event CarMinted(
        address indexed owner,
        uint256 indexed tokenId,
        string username,
        bytes32 traitsHash
    );

    // ─── Errors ──────────────────────────────────────────────────────
    error UsernameAlreadyMinted(string username);
    error EmptyUsername();
    error EmptyTraitsHash();

    // ─── Constructor ─────────────────────────────────────────────────
    constructor(string memory initialBaseURI)
        ERC721("CommitCar", "COMMIT")
        Ownable(msg.sender)
    {
        _baseTokenURI = initialBaseURI;
    }

    // ─── Mint ────────────────────────────────────────────────────────
    /**
     * @notice Mint a CommitCar for a GitHub username.
     * @dev Anyone can mint any username; the car itself is derived from public
     *      GitHub data so there is no exclusive claim. If you want one for your
     *      own account, be the first to mint it. One mint per username.
     * @param username  GitHub username (lowercase recommended, but not enforced)
     * @param traitsHash keccak256 of the traits JSON as computed by the app
     * @param tokenURI_  Optional per-token URI; pass "" to use baseURI + tokenId
     */
    function mint(
        string calldata username,
        bytes32 traitsHash,
        string calldata tokenURI_
    ) external returns (uint256) {
        if (bytes(username).length == 0) revert EmptyUsername();
        if (traitsHash == bytes32(0)) revert EmptyTraitsHash();
        if (tokenIdByUsername[username] != 0) revert UsernameAlreadyMinted(username);

        uint256 tokenId = ++_nextTokenId;
        tokenIdByUsername[username] = tokenId;
        usernameByTokenId[tokenId] = username;
        traitsHashOf[tokenId] = traitsHash;
        if (bytes(tokenURI_).length > 0) {
            _tokenURIs[tokenId] = tokenURI_;
        }

        _safeMint(msg.sender, tokenId);
        emit CarMinted(msg.sender, tokenId, username, traitsHash);
        return tokenId;
    }

    // ─── Metadata ────────────────────────────────────────────────────
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory uri = _tokenURIs[tokenId];
        if (bytes(uri).length > 0) return uri;
        string memory base_ = _baseTokenURI;
        return bytes(base_).length > 0
            ? string.concat(base_, usernameByTokenId[tokenId])
            : "";
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    // ─── Admin ───────────────────────────────────────────────────────
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    function setTokenURI(uint256 tokenId, string calldata newURI) external onlyOwner {
        _requireOwned(tokenId);
        _tokenURIs[tokenId] = newURI;
    }
}
