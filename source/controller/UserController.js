/*|********************************************************

    This controller handles user-related authentication,
    functionality, and administrative operations, such as
    user registration, login, logout, profile management,
    and more.

    NOTE: Customer CRUD operations should not be able to
        view the admin page or perform administrative 
        operations.

**********************************************************/
const User = require('../models/User.js');
const Product = require('../models/Product.js');
const Image = require('../models/Image.js');
const Variation = require('../models/Variation.js');
const Wishlist = require('../models/Wishlist.js');
const ShoppingCart = require('../models/ShoppingCart.js');
const Logger = require('../utils/logger');
const logger = new Logger();

const UserController = {

    getUpload: (req, res ) => {
        try {
            res.render('users/upload.ejs');
        } catch( error ) {
            // console.log( "getUpload() error: ", error );
        }
    },

    postUpload: async (req, res) => {
        try {
            if( req.file ) {
                const userID = req.session.userID; 
                const originalName = req.file.originalname;
                const fileName = req.file.filename;
                const destination = req.file.destination;
                const filePath = destination.replace( 'public', '' ) + '/' + fileName;
                
                const upload = await Image.uploadImage( userID, originalName, fileName, destination, filePath );
                if( upload.status !== 200 ) {
                    return res.status(401).json({ message: 'Image upload failed' });
                }
                return res.status(200).send( "Image Uploaded" );
            } else {
                return res.status(404).send( "File not found." );
            }
        } catch( error ) {
            // console.log( "Error: File upload failed" );
            return res.status(500).send( "File upload failed: " + error );
        }   
    },

    /*
        ` This function is called when the user sends a GET request to path '/login'. 
        If the user is already authorized and has chosen the "remember me" option, it
        redirects them to the homepage.
    */
    getLogin: (req, res) => {
        try {
            if (req.session.authorized && req.session.rememberMe) {
            res.redirect('/homepage');
            } else {
            req.session.authorized = false;
            res.render('users/login.ejs');
            }
        } catch (error) {
            logger.logSecurityEvent({
            userID: req.session.userID || 'N/A',
            action: 'Render Login Page Error',
            status: 500,
            route: req.originalUrl,
            message: `Error rendering login page: ${error.message}`
            });
            // console.log("getLogin() error:", error);
        }
    },

    /*
        ` This function is called when the user sends a POST request to path '/login',
        which occurs when the login button is pressed in the login page. It assumes the 
        login data being received is complete, i.e., the input error handling is done on 
        the front-end.
        
        When successful, it handles user authentication, session management, and provides 
        appropriate responses for both successful and failed login attempts. This function 
        is used for all users regardless of their roles (e.g. Guests, Admins).

        TODO: 
            - Create middleware to validate and sanitize the inputs
    */
    postLogin: async (req, res) => {
        try {
            if (req.session.authorized && req.session.rememberMe) {
            res.redirect('/homepage');
            }
    
            const { email, password, rememberMe } = req.body;
            const login = await User.login(email, password);
    
            if (login.status === 401 || login.status === 404) {
                logger.logSecurityEvent({
                    userID: req.session.userID || 'N/A',
                    action: 'Failed Login Attempt',
                    status: login.status,
                    route: req.originalUrl,
                    message: `Invalid credentials for user not found`
                });
                return res.status(401).json({ message: 'Invalid credentials' });
            } else if (login.status === 402) {
            logger.logSecurityEvent({
                userID: req.session.userID || 'N/A',
                action: 'Account Locked',
                status: 402,
                route: req.originalUrl,
                message: 'User account is locked'
            });
            return res.status(402).json({ message: "Account is locked" });
            }
    
            // Fetch and set session details
            const { userID } = await User.getUserID(email);
            const { highestRole, roleID } = await User.getHighestRole(email);
            req.session.rememberMe = rememberMe === 'true';
            req.session.authorized = true;
            req.session.email = email;
            req.session.username = login.username;
            req.session.userID = userID;
            req.session.userRole = highestRole;
            req.session.roleID = roleID;
    
            logger.logSecurityEvent({
            userID: req.session.userID,
            action: 'Successful Login',
            status: login.status,
            route: req.originalUrl,
            message: `User ${login.username} logged in. Role: ${highestRole}`
            });
    
            if (req.session.userRole === 'admin') {
            return res.status(200).json({
                message: "Admin login successful.",
                role: 'admin',
                username: login.username,
                lastLogin: login.lastLogin
            });
            } else {
            return res.status(201).json({
                message: "User login successful.",
                role: 'customer',
                username: login.username,
                lastLogin: login.lastLogin
            });
            }
        } catch (error) {
            logger.logSecurityEvent({
            userID: req.session.userID || 'N/A',
            action: 'Login Exception',
            status: 500,
            route: req.originalUrl,
            message: `Exception during login: ${error.message}`
            });
            console.error(error);
            return res.status(500).json({ message: 'An error occurred during login. Please try again.' });
        }
        },

    logout: (req, res) => {
        try {
            const uid = req.session.userID;
            req.session.destroy(() => {
            logger.logSecurityEvent({
                userID: uid || 'N/A',
                action: 'Logout',
                status: 200,
                route: '/logout',
                message: 'User logged out successfully'
            });
            });
            res.render('users/homepage');
        } catch (error) {
            logger.logSecurityEvent({
            userID: req.session.userID || 'N/A',
            action: 'Logout Exception',
            status: 500,
            route: req.originalUrl,
            message: `Error during logout: ${error.message}`
            });
            console.error(error);
            return res.status(500).json({ message: "An error occurred during logout. Please try again." });
        }
    },

    passwordReset: (req, res) => {
        try {
            res.render('users/passwordReset.ejs');
        } catch (error) {
            logger.logSecurityEvent({
            userID: req.session.userID || 'N/A',
            action: 'Render Password Reset Error',
            status: 500,
            route: req.originalUrl,
            message: `Error rendering password reset page: ${error.message}`
            });
            res.status(500).send("Error rendering password reset page.");
        }
        },

    /**
        ` This function should execute when the user sends a POST request to path '/register',
        which occurs when the register button is pressed in the registration page. It assumes
        the registration data being received is complete, i.e., the input error handling is 
        done on the front-end.

        TODO: 
            - Create middleware to validate and sanitize the inputs
    */
    register: async (req, res) => {
        try {
            const { name, username, email, password, question1, answer1, question2, answer2 } = req.body;
            const isEmailRegistered = await User.doesEmailExist(email);
            const isUsernameRegistered = await User.doesUsernameExist(username);
    
            if (isEmailRegistered) {
                logger.logSecurityEvent({
                    userID: 'N/A',
                    action: 'Registration Failed',
                    status: 400,
                    route: req.originalUrl,
                    message: `Email ${email} is already registered`
                });
                return res.status(400).json({ message: "This email is already registered." });
            } else if (isUsernameRegistered) {
                logger.logSecurityEvent({
                    userID: 'N/A',
                    action: 'Registration Failed',
                    status: 400,
                    route: req.originalUrl,
                    message: `Username ${username} is already registered`
                });
                return res.status(400).json({ message: "This username is already registered." });
            }
    
            await User.register(
            name.firstName,
            name.lastName,
            username,
            email,
            password,
            question1,
            answer1,
            question2,
            answer2
            );
    
            logger.logSecurityEvent({
                userID: 'N/A',
                action: 'Registration Successful',
                status: 201,
                route: req.originalUrl,
                message: `User registered with email: ${email}`
            });
    
            return res.status(201).json({ message: "Registration successful." });
        } catch (error) {
            logger.logSecurityEvent({
                userID: 'N/A',
                action: 'Registration Exception',
                status: 500,
                route: req.originalUrl,
                message: `Exception during registration: ${error.message}`
            });
            console.error("Error registering user:", error);
            return res.status(500).json({ message: "Registration failed." });
        }
    },

    /*
    */
    homepage: async (req, res) => {
        try {
          res.render('users/homepage.ejs');
        } catch (error) {
          logger.logSecurityEvent({
            userID: req.session.userID || 'N/A',
            action: 'Homepage Render Error',
            status: 500,
            route: req.originalUrl,
            message: `Error rendering homepage: ${error.message}`
          });
          // console.log("homepage() error:", error);
        }
    },

    /*
    */
    productCatalog: async (req, res) => {
        try {
          const { categories } = await Product.getBottomMostCategories();
          const { products } = await Product.getAllProductsWithImages();
    
          res.status(200).render('users/productCatalog.ejs', { categories, products });
        } catch (error) {
          logger.logSecurityEvent({
            userID: req.session.userID || 'N/A',
            action: 'Product Catalog Error',
            status: 500,
            route: req.originalUrl,
            message: `Error fetching product catalog: ${error.message}`
          });
          // console.log("productCatalog() error:", error);
        }
    },

    viewProduct: async (req, res) => {
        try {
          const productID = req.query.productID;
          const { categories } = await Product.getBottomMostCategories();
          const { product } = await Product.getProductWithImageByID(productID);
          const { images } = await Image.getAllImagesOfProduct(productID);
          const { variations } = await Variation.getAllVariationsOfProduct(productID);
    
          let isWishlisted = false;
          if (req.session.authorized) {
            const userID = req.session.userID;
            const { wishlist } = await Wishlist.getUserWishlist(userID);
            isWishlisted = wishlist.some(item => item.productID === product.productID);
          }
    
          res.status(200).render('users/viewProduct.ejs', {
            categories,
            product,
            productID,
            productImages: images,
            variations,
            isWishlisted
          });
        } catch (error) {
          logger.logSecurityEvent({
            userID: req.session.userID || 'N/A',
            action: 'View Product Error',
            status: 500,
            route: req.originalUrl,
            message: `Error retrieving product details: ${error.message}`
          });
          // console.log(error);
        }
      },

      wishlist: async (req, res) => {
        try {
          if (req.session.authorized) {
            const userID = req.session.userID;
            const { wishlist } = await Wishlist.getUserWishlist(userID);
            res.status(200).render('users/wishlist.ejs', { wishlist });
          } else {
            res.redirect('/');
          }
        } catch (error) {
          logger.logSecurityEvent({
            userID: req.session.userID || 'N/A',
            action: 'Wishlist Error',
            status: 500,
            route: req.originalUrl,
            message: `Error fetching wishlist: ${error.message}`
          });
          // console.log(error);
        }
      },

      wishlistProduct: async (req, res) => {
        try {
          if (req.session.authorized === true) {
            const { productID } = req.body;
            const userID = req.session.userID;
            const parsedProductID = parseInt(productID.replace(/\D/g, ''), 10);
    
            const wishlistStatus = await Wishlist.checkWishlistStatus(userID, parsedProductID);
            if (wishlistStatus.status === 200) {
              const response = await Wishlist.removeFromWishlist(userID, parsedProductID);
              logger.logSecurityEvent({
                userID: userID || 'N/A',
                action: 'Remove from Wishlist',
                status: response.status,
                route: req.originalUrl,
                message: 'Product removed from wishlist'
              });
              return res.status(response.status).json({ message: "Product removed from wishlist." });
            } else if (wishlistStatus.status === 404) {
              const response = await Wishlist.addToWishlist(userID, parsedProductID);
              logger.logSecurityEvent({
                userID: userID || 'N/A',
                action: 'Add to Wishlist',
                status: response.status,
                route: req.originalUrl,
                message: 'Product added to wishlist'
              });
              return res.status(response.status).json({ message: "Product added to wishlist." });
            } else {
              return res.status(500).json({ message: wishlistStatus.message });
            }
          } else {
            return res.status(404).json({ message: "User not logged in." });
          }
        } catch (error) {
          logger.logSecurityEvent({
            userID: req.session.userID || 'N/A',
            action: 'Wishlist Product Exception',
            status: 500,
            route: req.originalUrl,
            message: `Exception in wishlistProduct: ${error.message}`
          });
          // console.log("wishlistProduct Error:", error);
          res.status(500).json({ message: "Internal server error." });
        }
      },

      shoppingCart: async (req, res) => {
        try {
          if (req.session.authorized) {
            const userID = req.session.userID;
            const { shoppingCart, status } = await ShoppingCart.getUserShoppingCart(userID);
            if (status === 200) {
              res.status(200).render('users/shoppingCart.ejs', { shoppingCart });
            } else if (status === 404) {
              res.status(404).render('users/shoppingCart.ejs', { shoppingCart });
            }
          } else {
            res.redirect('/login');
          }
        } catch (error) {
          logger.logSecurityEvent({
            userID: req.session.userID || 'N/A',
            action: 'Shopping Cart Error',
            status: 500,
            route: req.originalUrl,
            message: `Error retrieving shopping cart: ${error.message}`
          });
          // console.log(error);
        }
      },

    wishlist: async (req, res) => {
        try {
            if( req.session.authorized ) {
                const userID = req.session.userID;
                const { wishlist } = await Wishlist.getUserWishlist( userID );
                res.status(200).render('./users/wishlist.ejs', { wishlist: wishlist });
            } else {
                res.redirect('/login');
            }
        } catch( error ) {
            // console.log( error );
        }
    },

    checkout: async (req, res) => {
        try {
          if (req.session.authorized) {
            const userID = req.session.userID;
            const { shoppingCart, status } = await ShoppingCart.getUserShoppingCart(userID);
            if (status === 200) {
              res.status(200).render('users/checkout.ejs', { shoppingCart });
            } else if (status === 404) {
              res.status(404).render('users/checkout.ejs', { shoppingCart });
            }
          } else {
            res.redirect('/');
          }
        } catch (error) {
          logger.logSecurityEvent({
            userID: req.session.userID || 'N/A',
            action: 'Checkout Error',
            status: 500,
            route: req.originalUrl,
            message: `Error during checkout: ${error.message}`
          });
          // console.log(error);
        }
      },

    /*
    checkShoppingCartStatus: async (req, res) => {
        try {
            if( req.session.authorized ) {
                const { variationID } = req.body;
                const userID = req.session.userID; 

                // - 200: in cart, 204: not in cart
                const shoppingCartStatus = await ShoppingCart.checkShoppingCartStatus( userID, variationID );
                return res.status(shoppingCartStatus.status).json();
            } else {
                return res.status(404).json({ message: "User not found."} );
            }
        } catch( error ) {
            res.status(500).json({ message: "Internal server error." });
        } 
    },
    */

    productToShoppingCart: async (req, res) => {
        try {
            if( req.session.authorized ) {
                const { variationID, quantity } = req.body;
                const userID = req.session.userID; 

                const shoppingCartStatus = await ShoppingCart.checkShoppingCartStatus( userID, variationID );
    
                if( shoppingCartStatus.status === 200 ) {
                    const response = await ShoppingCart.removeFromShoppingCart( userID, variationID );
                    return res.status(204).json({ message: "Product removed from cart." });
                } else 
                if( shoppingCartStatus.status === 204 ) {
                    const response = await ShoppingCart.addToShoppingCart( userID, variationID, quantity );
                    return res.status(200).json({ message: "Product added to cart." });
                } else {
                    return res.status(shoppingCartStatus.status).json({ message: shoppingCartStatus.message });
                }
            } else {
                return res.status(404).json({ message: "User not found."} );
            }
        } catch( error ) {
            res.status(500).json({ message: "Internal server error." });
        }   
    },

    // - Called in the quantity buttons of shoppingCart.js
    updateShoppingCartItemQuantity: async (req, res) => {
        try {
            const { variationID, newQuantity } = req.body;
            const userID = req.session.userID;

            const itemResponse = await ShoppingCart.updateItemQuantity( userID, variationID, newQuantity )
            if( itemResponse.status === 200 ) {
                return res.status(200).json({ message: "Quantity updated"});
            } else {
                return res.status(500).json({ message: itemResponse.message });
            }
        } catch( error ) {
            // console.log( "updateShoppingCartItemQuantity Error:", error );
            res.status(500).json({ message: "Internal server error." });
        }
    },

    userCheck: async (req, res) => {
        try {
            const { email } = req.body;
            const exists = await User.doesEmailExist(email);

            if (exists) {
            const { status } = await User.checkPasswordTime(email);
            if (status === 201) {
                return res.status(201).json({ message: "User Can Change Password" });
            }
            return res.status(402).json({ message: "User Cannot Change Password" });
            } else {
            return res.status(401).json({ message: 'Cannot find email' });
            }
        } catch (error) {
            logger.logSecurityEvent({
            userID: req.session.userID || 'N/A',
            action: 'User Check Error',
            status: 500,
            route: req.originalUrl,
            message: `Error in userCheck: ${error.message}`
            });
            console.error(error);
            return res.status(500).json({ message: 'An error occurred during user lookup. Please try again.' });
        }
    },
    
    securityQuestion: async (req, res) => {
        try {
          const { email } = req.body;
          const { status, question1, question2 } = await User.getSecurityQuestions(email);
    
          if (status === 201) {
            return res.status(201).json({ message: "Successfully found security questions.", question1, question2 });
          }
          return res.status(500).json({ message: 'Internal Server Error' });
        } catch (error) {
          logger.logSecurityEvent({
            userID: req.session.userID || 'N/A',
            action: 'Security Question Error',
            status: 500,
            route: req.originalUrl,
            message: `Error fetching security questions: ${error.message}`
          });
          console.error(error);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
      },

    compareAnswers: async (req, res) => {
        try {
            const { email, answer1, answer2 } = req.body;
            const { status } = await User.compareAnswers(email, answer1, answer2);

            if (status === 201) {
            return res.status(201).json({ message: "Answers are correct." });
            } else if (status === 401) {
            return res.status(401).json({ message: "Answers are not correct." });
            }
            return res.status(500).json({ message: "Internal Server Error" });
        } catch (error) {
            logger.logSecurityEvent({
            userID: req.session.userID || 'N/A',
            action: 'Compare Answers Error',
            status: 500,
            route: req.originalUrl,
            message: `Error comparing security answers: ${error.message}`
            });
            console.error(error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    postPasswordReset: async (req, res) => {
        try {
          const { email, password } = req.body;
          const { status } = await User.passwordReset(email, password);
    
          if (status === 201) {
            return res.status(201).json({ message: "Password Changed Successfully." });
          } else if (status === 401) {
            return res.status(401).json({ message: "Password Is Same As Current" });
          } else if (status === 402) {
            return res.status(402).json({ message: "This Password Has Been Used Before" });
          }
          return res.status(500).json({ message: "Internal Server Error" });
        } catch (error) {
          logger.logSecurityEvent({
            userID: req.session.userID || 'N/A',
            action: 'Password Reset Error',
            status: 500,
            route: req.originalUrl,
            message: `Error during password reset: ${error.message}`
          });
          console.error(error);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}

module.exports = UserController;