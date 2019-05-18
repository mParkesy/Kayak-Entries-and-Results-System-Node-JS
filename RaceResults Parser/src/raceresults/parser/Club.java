/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package raceresults.parser;

/**
 * A club with 3 strings
 * @author mattp
 */
public class Club {
    public String name;
    public String code;
    public String region;
    
    public Club(String n, String c, String r){
        this.name = n;
        this.code = c;
        this.region = r;
    }
}
