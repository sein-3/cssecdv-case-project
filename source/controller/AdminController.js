/*|********************************************************

    This controller handles user-related authentication,
    functionality, and administrative operations, such as
    user registration, login, logout, profile management,
    and more.

    NOTE: Customer CRUD operations should not be able to
        view the admin page or perform administrative 
        operations.

**********************************************************/
// controller/AdminController.js
const db = require('../config/database.js');
const fse = require('fs-extra');
const Product = require('../models/Product.js');
const Image = require('../models/Image.js');
const Variation = require('../models/Variation.js');
const Logger = require('../utils/logger.js');

const logger = new Logger();

const AdminController = {

    inventory: async (req, res) => {
        try {
            if (req.session.authorized && req.session.userRole === 'admin') {
                const { categories } = await Product.getBottomMostCategories();
                const { products } = await Product.getAllProductsWithImages();
                logger.logSecurityEvent({
                    userID: req.session.userID || 'N/A',
                    action: 'Access Inventory Page',
                    status: 200,
                    route: req.originalUrl,
                    message: 'Admin accessed inventory page successfully.'
                });
                res.render('./admin/inventory.ejs', { categories, products });
            } else {
                logger.logSecurityEvent({
                    userID: req.session.userID || 'N/A',
                    action: 'Access Inventory Page Denied',
                    status: 403,
                    route: req.originalUrl,
                    message: 'Unauthorized admin inventory access attempt.'
                });
                res.redirect('/');
            }
        } catch (error) {
            logger.logSecurityEvent({
                userID: req.session.userID || 'N/A',
                action: 'Inventory Page Error',
                status: 500,
                route: req.originalUrl,
                message: error.message
            });
            console.log("AdminController.js - inventory() Error:", error);
        }
    },

    viewProductAdmin: async (req, res) => {
        try {
            if (req.session.authorized && req.session.userRole === 'admin') {
                const productID = req.query.productID;
                const { categories } = await Product.getBottomMostCategories();
                const { product } = await Product.getProductWithImageByID(productID);
                const { images } = await Image.getAllImagesOfProduct(productID);
                const { variations } = await Variation.getAllVariationsOfProduct(productID);
                logger.logSecurityEvent({
                    userID: req.session.userID || 'N/A',
                    action: 'View Product Admin',
                    status: 200,
                    route: req.originalUrl,
                    message: `Admin viewed product details for product ID: ${productID}`
                });
                res.status(200).render('./admin/adminProductView.ejs', { 
                    categories, 
                    product, 
                    productID, 
                    productImages: images, 
                    variations 
                });
            } else {
                logger.logSecurityEvent({
                    userID: req.session.userID || 'N/A',
                    action: 'Unauthorized View Product Admin',
                    status: 403,
                    route: req.originalUrl,
                    message: 'Unauthorized admin product view attempt.'
                });
                res.redirect('/');
            }
        } catch (error) {
            logger.logSecurityEvent({
                userID: req.session.userID || 'N/A',
                action: 'View Product Admin Error',
                status: 500,
                route: req.originalUrl,
                message: error.message
            });
            console.log("AdminController.js - viewProductAdmin() Error:", error);
        }
    },

    editProduct: async (req, res) => {
        try {
            if (req.session.authorized && req.session.userRole === 'admin') {
                const productID = req.query.productID;
                const { categories } = await Product.getBottomMostCategories();
                const { product } = await Product.getProductWithImageByID(productID);
                const { images } = await Image.getAllImagesOfProduct(productID);
                const { variations } = await Variation.getAllVariationsOfProduct(productID);
                logger.logSecurityEvent({
                    userID: req.session.userID || 'N/A',
                    action: 'Edit Product Access',
                    status: 200,
                    route: req.originalUrl,
                    message: `Admin accessed edit page for product ID: ${productID}`
                });
                res.status(200).render('./admin/editProduct.ejs', { 
                    categories, 
                    product, 
                    productID, 
                    productImages: images, 
                    variations 
                });
            } else {
                logger.logSecurityEvent({
                    userID: req.session.userID || 'N/A',
                    action: 'Unauthorized Edit Product',
                    status: 403,
                    route: req.originalUrl,
                    message: 'Unauthorized access to edit product page.'
                });
                res.redirect('/');
            }
        } catch (error) {
            logger.logSecurityEvent({
                userID: req.session.userID || 'N/A',
                action: 'Edit Product Error',
                status: 500,
                route: req.originalUrl,
                message: error.message
            });
            console.log("AdminController.js - editProduct() Error:", error);
        }
    },

    getRegisterProduct: async (req, res) => {
        if (req.session.authorized && req.session.userRole === 'admin') {
            const { categories } = await Product.getBottomMostCategories();
            logger.logSecurityEvent({
                userID: req.session.userID || 'N/A',
                action: 'Access Register Product Page',
                status: 200,
                route: req.originalUrl,
                message: 'Admin accessed register product page.'
            });
            res.status(200).render('./admin/registerProduct.ejs', { categories });
        } else {
            logger.logSecurityEvent({
                userID: req.session.userID || 'N/A',
                action: 'Unauthorized Register Product Page',
                status: 403,
                route: req.originalUrl,
                message: 'Unauthorized access attempt to register product page.'
            });
            res.redirect('/');
        }
    },

    postRegisterProduct: async (req, res) => {
        if (req.session.authorized && req.session.userRole === 'admin') {
            const { name, description, price, categoryID } = req.body;
            const result = await Product.createProduct(name, description, price, categoryID);
            if (result.status === 201) {
                logger.logSecurityEvent({
                    userID: req.session.userID || 'N/A',
                    action: 'Product Registration',
                    status: 201,
                    route: req.originalUrl,
                    message: `Product created successfully. Product ID: ${result.productID}`
                });
                return res.status(201).json({ message: "Product created", productID: result.productID });
            } else {
                logger.logSecurityEvent({
                    userID: req.session.userID || 'N/A',
                    action: 'Product Registration Failure',
                    status: 500,
                    route: req.originalUrl,
                    message: 'Failed to create product.'
                });
                return res.status(500).json({ message: "Product not created" });
            }
        } else {
            logger.logSecurityEvent({
                userID: req.session.userID || 'N/A',
                action: 'Unauthorized Product Registration',
                status: 403,
                route: req.originalUrl,
                message: 'Unauthorized access attempt to register product.'
            });
            res.redirect('/');
        }
    },

    createProductVariations: async (req, res) => {
        if (req.session.authorized && req.session.userRole === 'admin') {
            const { productID, variations } = req.body;
            const errorMessages = [];
            for (const variation of variations) {
                const { name, color, stock } = variation;
                const result = await Variation.createVariation(productID, name, color, stock);
                if (result.status !== 201) {
                    errorMessages.push(`${name}`);
                }
            }
            if (errorMessages.length === 0) {
                logger.logSecurityEvent({
                    userID: req.session.userID || 'N/A',
                    action: 'Create Product Variations',
                    status: 201,
                    route: req.originalUrl,
                    message: `All variations created for product ID: ${productID}`
                });
                return res.status(201).json({ message: "All variations created" });
            } else {
                logger.logSecurityEvent({
                    userID: req.session.userID || 'N/A',
                    action: 'Create Product Variations Partial Failure',
                    status: 500,
                    route: req.originalUrl,
                    message: `Some variations not created for product ID: ${productID}; Failures: ${errorMessages.join(', ')}`
                });
                return res.status(500).json({ message: "Some variations are not created", errors: errorMessages });
            }
        } else {
            logger.logSecurityEvent({
                userID: req.session.userID || 'N/A',
                action: 'Unauthorized Create Variations',
                status: 403,
                route: req.originalUrl,
                message: 'Unauthorized access attempt to create product variations.'
            });
            res.redirect('/');
        }
    },

    deleteProduct: async (req, res) => {
        if (req.session.authorized && req.session.userRole === 'admin') {
            const { productID } = req.body;
            const result = await Product.deleteProduct(productID);
            if (result.status === 201) {
                logger.logSecurityEvent({
                    userID: req.session.userID || 'N/A',
                    action: 'Delete Product',
                    status: 201,
                    route: req.originalUrl,
                    message: `Product ID ${productID} deleted successfully.`
                });
                return res.status(201).json({ message: "Product deleted" });
            } else {
                logger.logSecurityEvent({
                    userID: req.session.userID || 'N/A',
                    action: 'Delete Product Failure',
                    status: 500,
                    route: req.originalUrl,
                    message: `Failed to delete product ID ${productID}.`
                });
                return res.status(500).json({ message: "Product not deleted" });
            }
        } else {
            logger.logSecurityEvent({
                userID: req.session.userID || 'N/A',
                action: 'Unauthorized Delete Product',
                status: 403,
                route: req.originalUrl,
                message: 'Unauthorized access attempt to delete product.'
            });
            res.redirect('/');
        }
    },

    updateProduct: async (req, res) => {
        if (req.session.authorized && req.session.userRole === 'admin') {
            const product = req.body;
            const response = await Product.updateProduct(product);
            logger.logSecurityEvent({
                userID: req.session.userID || 'N/A',
                action: 'Update Product',
                status: response.status,
                route: req.originalUrl,
                message: `Product ID ${product.productID} updated successfully.`
            });
            res.status(200).json({ message: "Product updated successfully" });
        } else {
            logger.logSecurityEvent({
                userID: req.session.userID || 'N/A',
                action: 'Unauthorized Update Product',
                status: 403,
                route: req.originalUrl,
                message: 'Unauthorized access attempt to update product.'
            });
            return res.status(500).json({ message: "Product not updated" });
        }
    },

    uploadTemporaryImage: async (req, res) => {
        try {
            if (req.file) {
                const userID = req.session.userID;
                const originalName = req.file.originalname;
                const fileName = req.file.filename;
                const destination = req.file.destination;
                const filePath = destination.replace('public/', '/') + '/' + fileName;
                const image = { userID, originalName, fileName, destination, filePath };
                logger.logSecurityEvent({
                    userID: userID || 'N/A',
                    action: 'Upload Temporary Image',
                    status: 200,
                    route: req.originalUrl,
                    message: `Temporary image uploaded: ${fileName}`
                });
                return res.status(200).json({ message: "Image uploaded", image });
            } else {
                logger.logSecurityEvent({
                    userID: req.session.userID || 'N/A',
                    action: 'Upload Temporary Image Failed',
                    status: 404,
                    route: req.originalUrl,
                    message: "No file found in the request."
                });
                return res.status(404).send("File not found.");
            }
        } catch (error) {
            logger.logSecurityEvent({
                userID: req.session.userID || 'N/A',
                action: 'Upload Temporary Image Exception',
                status: 500,
                route: req.originalUrl,
                message: `File upload failed: ${error.message}`
            });
            console.log("Error: File upload failed", error);
            res.status(500).send("File upload failed: " + error);
        }
    },

    uploadImageReference: async (req, res) => {
        try {
            if (req.body.imageDetails) {
                const { imageDetails } = req.body;
                const errorMessages = [];
                const uploadedImagesID = [];
                console.log(imageDetails);
                for (const imageDetail of imageDetails) {
                    const { userID, originalName, fileName, destination, filePath } = imageDetail;
                    const newDestination = destination.replace('/temporary', '/products');
                    const newFilePath = filePath.replace('/temporary', '/products');

                    // Move image from temporary to product 
                    const sourcePath = filePath.replace('/upload', './public/upload');
                    const destinationPath = newFilePath.replace('/upload', './public/upload');
                    fse.move(sourcePath, destinationPath);

                    // Add image reference to the database
                    const result = await Image.uploadImage(userID, originalName, fileName, newDestination, newFilePath);
                    if (result.status === 200) {
                        uploadedImagesID.push(result.imageID);
                    } else {
                        errorMessages.push(`${originalName}`);
                    }
                }
                if (errorMessages.length === 0) {
                    logger.logSecurityEvent({
                        userID: req.session.userID || 'N/A',
                        action: 'Upload Image Reference',
                        status: 200,
                        route: req.originalUrl,
                        message: 'All images uploaded successfully.'
                    });
                    return res.status(200).json({ message: "All images uploaded", imagesID: uploadedImagesID });
                } else {
                    logger.logSecurityEvent({
                        userID: req.session.userID || 'N/A',
                        action: 'Upload Image Reference Partial Failure',
                        status: 500,
                        route: req.originalUrl,
                        message: `Some images failed: ${errorMessages.join(', ')}`
                    });
                    return res.status(500).json({ message: "Some images are not created", errors: errorMessages, imageDetails: imageDetails });
                }
            } else {
                logger.logSecurityEvent({
                    userID: req.session.userID || 'N/A',
                    action: 'Upload Image Reference Failed',
                    status: 404,
                    route: req.originalUrl,
                    message: "Files not found."
                });
                return res.status(404).send("Files not found.");
            }
        } catch (error) {
            logger.logSecurityEvent({
                userID: req.session.userID || 'N/A',
                action: 'Upload Image Reference Exception',
                status: 500,
                route: req.originalUrl,
                message: `File upload failed: ${error.message}`
            });
            console.log("Error: File upload failed", error);
            res.status(500).send("File upload failed: " + error);
        }
    },

    createProductImage: async (req, res) => {
        try {
            if (req.session.authorized && req.session.userRole === 'admin') {
                const { productID, imagesID } = req.body;
                const errorMessages = [];
                for (const imageID of imagesID) {
                    const result = await Image.createProductImage(productID, imageID);
                    if (result.status !== 201) {
                        errorMessages.push(`${imageID}`);
                    }
                }
                if (errorMessages.length === 0) {
                    logger.logSecurityEvent({
                        userID: req.session.userID || 'N/A',
                        action: 'Create Product Image',
                        status: 201,
                        route: req.originalUrl,
                        message: `Product images created successfully for productID: ${productID}`
                    });
                    return res.status(201).json({ message: "All product images created" });
                } else {
                    logger.logSecurityEvent({
                        userID: req.session.userID || 'N/A',
                        action: 'Create Product Image Partial Failure',
                        status: 500,
                        route: req.originalUrl,
                        message: `Some product images failed to create for productID: ${productID}; Failures: ${errorMessages.join(', ')}`
                    });
                    return res.status(500).json({ message: "Some product images are not created", errors: errorMessages });
                }
            } else {
                logger.logSecurityEvent({
                    userID: req.session.userID || 'N/A',
                    action: 'Unauthorized Create Product Image',
                    status: 403,
                    route: req.originalUrl,
                    message: 'Unauthorized access attempt to create product image.'
                });
                res.redirect('/');
            }
        } catch (error) {
            logger.logSecurityEvent({
                userID: req.session.userID || 'N/A',
                action: 'Create Product Image Exception',
                status: 500,
                route: req.originalUrl,
                message: `Exception while creating product image: ${error.message}`
            });
            console.log("Error: Create product image failed", error);
            res.status(500).send("Create product image error: " + error);
        }
    },

    deleteProductImage: async (req, res) => {
        try {
            // Implementation for deletion goes here.
        } catch (error) {
            logger.logSecurityEvent({
                userID: req.session.userID || 'N/A',
                action: 'Delete Product Image Error',
                status: 500,
                route: req.originalUrl,
                message: `Error deleting product image: ${error.message}`
            });
        }
    }
};

module.exports = AdminController;