/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package raceresults.parser;

import java.math.BigInteger;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.Connection;
import java.sql.DriverManager;

/**
 * The Database class allows the application to get access to the SQL database
 * 
 * A singleton design pattern has been used to prevent multiple instances of the
 * database connection opening.
 */
public class Database {
    private static final String URL = "jdbc:mysql://localhost:3306/kayakmanagement?useLegacyDatetimeCode=false&serverTimezone=UTC";
    private static final String USERNAME = "root";
    private static final String PASS = "";
    private static Connection CON = null;
    
    /**
     * Only exists to prevent any other class instantiating this
     */
    private Database(){}
    
    /**
     * Checks to see if:
     *   a) The connection has been instantiated yet
     *   b) If the connection has, whether it's valid
     * @return the connection
     */
    public static Connection getConnection() throws Exception{
        if(CON == null){
            CON = DriverManager.getConnection(URL, USERNAME, PASS);
            return CON;
        }
        else if(CON.isValid(1) == false){
            CON = DriverManager.getConnection(URL, USERNAME, PASS);
            return CON;
        }
        else{
            return CON;
        }
    }
    
    
}